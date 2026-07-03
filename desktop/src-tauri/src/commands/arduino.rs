use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LibraryInfo {
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BoardInfo {
    pub name: String,
    pub fqbn: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompileResult {
    pub success: bool,
    pub output: String,
    pub error: String,
    pub duration_ms: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UploadResult {
    pub success: bool,
    pub output: String,
    pub error: String,
    pub duration_ms: u64,
}

const DEFAULT_SKETCH: &str = r#"void setup() {
  Serial.begin(115200);
}

void loop() {
  delay(10);
}
"#;

// ── Resolve CLI path ───────────────────────────

fn get_cli(state: &AppState) -> String {
    state
        .arduino_cli_path
        .lock()
        .unwrap()
        .clone()
        .unwrap_or_else(|| "arduino-cli".to_string())
}

fn resolve_project_path(state: &AppState) -> Result<PathBuf, String> {
    let ws = state.active_workspace_id.lock().unwrap();
    match *ws {
        Some(ref ws_id) => {
            let base = state.workspace_root.lock().unwrap().clone();
            let path = PathBuf::from(&base).join(ws_id);
            std::fs::create_dir_all(&path)
                .map_err(|e| format!("Cannot create workspace directory: {}", e))?;
            Ok(path)
        }
        None => Err("No workspace open. Open a project first.".into()),
    }
}

fn ensure_sketch(project_path: &PathBuf) -> Result<PathBuf, String> {
    // Look for existing .ino
    if let Ok(entries) = std::fs::read_dir(project_path) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.ends_with(".ino") {
                return Ok(entry.path());
            }
        }
    }
    // Auto-create one
    let sketch_name = project_path
        .file_name()
        .unwrap_or(std::ffi::OsStr::new("sketch"))
        .to_string_lossy()
        .to_string();
    let sketch_path = project_path.join(format!("{}.ino", sketch_name));
    std::fs::write(&sketch_path, DEFAULT_SKETCH)
        .map_err(|e| format!("Cannot create sketch: {}", e))?;
    Ok(sketch_path)
}

// ── Detection ──────────────────────────────────

#[tauri::command]
pub async fn detect_arduino(state: State<'_, AppState>) -> Result<String, String> {
    let paths = [
        "arduino-cli",
        "/usr/local/bin/arduino-cli",
        "/opt/homebrew/bin/arduino-cli",
    ];
    for path in &paths {
        if let Ok(output) = Command::new(path).arg("version").output() {
            if output.status.success() {
                *state.arduino_cli_path.lock().unwrap() = Some(path.to_string());
                return Ok(path.to_string());
            }
        }
    }
    Err("Arduino CLI not found. Install with: brew install arduino-cli".into())
}

// ── Boards ────────────────────────────────────

#[tauri::command]
pub async fn list_boards(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let cli = get_cli(&state);
    let output = Command::new(&cli)
        .args(["board", "listall", "--format", "json"])
        .output()
        .map_err(|e| format!("arduino-cli error: {}", e))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Board list failed: {}", stderr));
    }
    let data: serde_json::Value =
        serde_json::from_slice(&output.stdout).unwrap_or_default();
    Ok(data["boards"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|b| b["name"].as_str().map(String::from))
        .collect())
}

#[tauri::command]
pub async fn list_ports(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let cli = get_cli(&state);
    let output = Command::new(&cli)
        .args(["board", "list", "--format", "json"])
        .output()
        .map_err(|e| format!("arduino-cli error: {}", e))?;
    if !output.status.success() {
        return Ok(vec![]);
    }
    let data: serde_json::Value =
        serde_json::from_slice(&output.stdout).unwrap_or_default();
    Ok(data["detected_ports"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|p| p["port"]["address"].as_str().map(String::from))
        .collect())
}

// ── Compile ───────────────────────────────────

#[tauri::command]
pub async fn compile_sketch(
    state: State<'_, AppState>,
    board: String,
) -> Result<CompileResult, String> {
    if board.is_empty() {
        return Err("No board selected. Please select a board first.".into());
    }

    let cli = get_cli(&state);
    let project_path = resolve_project_path(&state)?;
    let _sketch = ensure_sketch(&project_path)?;
    let start = std::time::Instant::now();

    let output = Command::new(&cli)
        .current_dir(&project_path)
        .args(["compile", "--fqbn", &board, "."])
        .output()
        .map_err(|e| format!("arduino-cli not found: {}", e))?;

    let duration = start.elapsed().as_millis() as u64;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        let combined = format!("{}{}", stdout, stderr);
        let friendly = if combined.contains("main file missing") {
            "No sketch found. Create a .ino file in the workspace.".into()
        } else if combined.contains("Cannot find Arduino") {
            format!("Unknown board '{}'. Check board selection.", board)
        } else if combined.contains("fqbn") {
            format!("Invalid board identifier for '{}'.", board)
        } else if combined.contains("library") && combined.contains("not found") {
            "Missing library. Install it from the Libraries tab.".into()
        } else if combined.contains("setup") && combined.contains("loop") {
            "Sketch must have setup() and loop() functions.".into()
        } else {
            combined
        };
        return Ok(CompileResult {
            success: false,
            output: stdout,
            error: friendly,
            duration_ms: duration,
        });
    }

    Ok(CompileResult {
        success: true,
        output: stdout,
        error: String::new(),
        duration_ms: duration,
    })
}

// ── Upload ────────────────────────────────────

#[tauri::command]
pub async fn upload_sketch(
    state: State<'_, AppState>,
    board: String,
    port: String,
) -> Result<UploadResult, String> {
    if board.is_empty() {
        return Err("No board selected.".into());
    }
    if port.is_empty() {
        return Err("No port selected. Connect your board and select a port.".into());
    }

    let cli = get_cli(&state);
    let project_path = resolve_project_path(&state)?;
    let _sketch = ensure_sketch(&project_path)?;
    let start = std::time::Instant::now();

    let output = Command::new(&cli)
        .current_dir(&project_path)
        .args(["upload", "--fqbn", &board, "-p", &port, "."])
        .output()
        .map_err(|e| format!("arduino-cli not found: {}", e))?;

    let duration = start.elapsed().as_millis() as u64;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        let combined = format!("{}{}", stdout, stderr);
        let friendly = if combined.contains("not connected") || combined.contains("port") {
            format!("Board not found on {}. Check USB connection.", port)
        } else if combined.contains("permission denied") {
            format!("Permission denied on {}. Try: sudo chmod 666 {}", port, port)
        } else if combined.contains("timeout") {
            "Upload timed out. Try pressing the reset button on your board.".into()
        } else {
            combined
        };
        return Ok(UploadResult {
            success: false,
            output: stdout,
            error: friendly,
            duration_ms: duration,
        });
    }

    Ok(UploadResult {
        success: true,
        output: stdout,
        error: String::new(),
        duration_ms: duration,
    })
}

#[tauri::command]
pub async fn serial_monitor(_port: String, _baud_rate: u32) -> Result<(), String> {
    Ok(())
}

// ── Libraries ─────────────────────────────────

#[tauri::command]
pub async fn list_libraries(state: State<'_, AppState>) -> Result<Vec<LibraryInfo>, String> {
    let cli = get_cli(&state);
    let output = Command::new(&cli)
        .args(["lib", "list", "--format", "json"])
        .output()
        .map_err(|e| format!("arduino-cli error: {}", e))?;
    if !output.status.success() {
        return Ok(vec![]);
    }
    let data: serde_json::Value =
        serde_json::from_slice(&output.stdout).unwrap_or_default();
    Ok(data["installed_libraries"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .map(|l| LibraryInfo {
            name: l["library"]["name"]
                .as_str()
                .unwrap_or("")
                .to_string(),
            version: l["library"]["version"]
                .as_str()
                .unwrap_or("?")
                .to_string(),
            author: l["library"]["author"]
                .as_str()
                .unwrap_or("")
                .to_string(),
            description: l["library"]["sentence"]
                .as_str()
                .unwrap_or("")
                .to_string(),
        })
        .collect())
}

#[tauri::command]
pub async fn search_libraries(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<LibraryInfo>, String> {
    let cli = get_cli(&state);
    let output = Command::new(&cli)
        .args(["lib", "search", &query, "--format", "json"])
        .output()
        .map_err(|e| format!("arduino-cli error: {}", e))?;
    if !output.status.success() {
        return Ok(vec![]);
    }
    let data: serde_json::Value =
        serde_json::from_slice(&output.stdout).unwrap_or_default();
    Ok(data["libraries"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .map(|l| LibraryInfo {
            name: l["name"].as_str().unwrap_or("").to_string(),
            version: l["latest"]["version"]
                .as_str()
                .unwrap_or("?")
                .to_string(),
            author: l["author"].as_str().unwrap_or("").to_string(),
            description: l["sentence"].as_str().unwrap_or("").to_string(),
        })
        .collect())
}

#[tauri::command]
pub async fn install_library(
    state: State<'_, AppState>,
    name: String,
) -> Result<(), String> {
    let cli = get_cli(&state);
    let status = Command::new(&cli)
        .args(["lib", "install", &name])
        .status()
        .map_err(|e| format!("arduino-cli error: {}", e))?;
    if status.success() {
        Ok(())
    } else {
        Err("Install failed".into())
    }
}

#[tauri::command]
pub async fn remove_library(
    state: State<'_, AppState>,
    name: String,
) -> Result<(), String> {
    let cli = get_cli(&state);
    let status = Command::new(&cli)
        .args(["lib", "uninstall", &name])
        .status()
        .map_err(|e| format!("arduino-cli error: {}", e))?;
    if status.success() {
        Ok(())
    } else {
        Err("Uninstall failed".into())
    }
}
