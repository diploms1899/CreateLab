use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct ArduinoBoard {
    pub name: String,
    pub fqbn: String,
    pub port: Option<String>,
}

#[tauri::command]
pub async fn detect_arduino(state: State<'_, AppState>) -> Result<String, String> {
    let paths = [
        "arduino-cli",
        "/usr/local/bin/arduino-cli",
        "/opt/homebrew/bin/arduino-cli",
        "C:\\Program Files\\Arduino CLI\\arduino-cli.exe",
    ];
    for path in &paths {
        if let Ok(output) = Command::new(path).arg("version").output() {
            if output.status.success() {
                *state.arduino_cli_path.lock().unwrap() = Some(path.to_string());
                return Ok(path.to_string());
            }
        }
    }
    Err("Arduino CLI not found. Install from https://arduino.github.io/arduino-cli/".into())
}

#[tauri::command]
pub async fn list_boards(state: State<'_, AppState>) -> Result<Vec<ArduinoBoard>, String> {
    let cli = state.arduino_cli_path.lock().unwrap().clone()
        .unwrap_or_else(|| "arduino-cli".to_string());
    let output = Command::new(&cli)
        .args(["board", "list", "--format", "json"])
        .output()
        .map_err(|e| format!("Failed to list boards: {}", e))?;
    if !output.status.success() {
        return Ok(vec![]);
    }
    let raw = String::from_utf8_lossy(&output.stdout);
    let boards: Vec<ArduinoBoard> = serde_json::from_str(&raw).unwrap_or_default();
    Ok(boards)
}

#[tauri::command]
pub async fn compile(state: State<'_, AppState>, board: String, sketch_path: String) -> Result<String, String> {
    let cli = state.arduino_cli_path.lock().unwrap().clone()
        .unwrap_or_else(|| "arduino-cli".to_string());
    let output = Command::new(&cli)
        .args(["compile", "--fqbn", &board, &sketch_path])
        .output()
        .map_err(|e| format!("Compilation failed: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    if output.status.success() {
        Ok(format!("Compilation successful.\n{}", stdout))
    } else {
        Err(format!("Compilation failed.\n{}", stderr))
    }
}

#[tauri::command]
pub async fn upload(state: State<'_, AppState>, board: String, port: String, sketch_path: String) -> Result<String, String> {
    let cli = state.arduino_cli_path.lock().unwrap().clone()
        .unwrap_or_else(|| "arduino-cli".to_string());
    let output = Command::new(&cli)
        .args(["upload", "--fqbn", &board, "--port", &port, &sketch_path])
        .output()
        .map_err(|e| format!("Upload failed: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    if output.status.success() {
        Ok(format!("Upload successful.\n{}", stdout))
    } else {
        Err(format!("Upload failed.\n{}", stderr))
    }
}

#[tauri::command]
pub async fn serial_monitor(_port: String, _baud_rate: u32) -> Result<(), String> {
    Err("Serial monitor not implemented in headless mode. Use Arduino IDE or screen/tio.".into())
}
