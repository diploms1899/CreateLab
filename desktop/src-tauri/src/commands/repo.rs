use serde::{Deserialize, Serialize};
use std::process::Command;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct DirSize {
    pub name: String,
    pub size_bytes: u64,
    pub human: String,
    pub category: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthReport {
    pub repo_size_human: String,
    pub source_count: u32,
    pub ignored_dirs: Vec<DirSize>,
    pub clean: bool,
}

fn format_size(bytes: u64) -> String {
    if bytes >= 1_000_000_000 { format!("{:.1} GB", bytes as f64 / 1e9) }
    else if bytes >= 1_000_000 { format!("{:.1} MB", bytes as f64 / 1e6) }
    else if bytes >= 1_000 { format!("{:.1} KB", bytes as f64 / 1e3) }
    else { format!("{} B", bytes) }
}

fn dir_size(path: &std::path::Path) -> u64 {
    if !path.exists() { return 0; }
    if path.is_file() { return std::fs::metadata(path).map(|m| m.len()).unwrap_or(0); }
    let mut total = 0u64;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            total += dir_size(&entry.path());
        }
    }
    total
}

#[tauri::command]
pub async fn scan_repo_health() -> Result<HealthReport, String> {
    let project_root = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));

    let mut ignored_dirs: Vec<DirSize> = Vec::new();
    let checks = [
        ("desktop/src-tauri/target", "cache"),
        ("desktop/node_modules", "cache"),
        ("server/.venv", "cache"),
        ("server/__pycache__", "cache"),
        ("server/data", "source"),
    ];

    for (rel, cat) in &checks {
        let p = project_root.join(rel);
        let sz = dir_size(&p);
        if sz > 0 {
            ignored_dirs.push(DirSize {
                name: rel.to_string(),
                size_bytes: sz,
                human: format_size(sz),
                category: cat.to_string(),
            });
        }
    }

    // Count git-tracked files
    let tracked = Command::new("git")
        .args(["ls-files"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).lines().count() as u32)
        .unwrap_or(0);

    // Check git clean
    let clean = Command::new("git")
        .args(["status", "--porcelain"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().is_empty())
        .unwrap_or(false);

    let total_repo = dir_size(&project_root);
    let total_ignored: u64 = ignored_dirs.iter().map(|d| d.size_bytes).sum();
    let source_size = total_repo.saturating_sub(total_ignored);

    Ok(HealthReport {
        repo_size_human: format_size(source_size),
        source_count: tracked,
        ignored_dirs,
        clean,
    })
}

/// Allowed commands for run_shell_cmd. Add only safe, read-only commands.
const ALLOWED_COMMANDS: &[&str] = &["git", "cargo", "arduino-cli", "node", "npm", "python"];

#[tauri::command]
pub async fn run_shell_cmd(cmd: Vec<String>) -> Result<String, String> {
    if cmd.is_empty() { return Err("No command".into()); }
    let prog = &cmd[0];
    if !ALLOWED_COMMANDS.contains(&prog.as_str()) {
        return Err(format!("Command '{}' is not allowed", prog));
    }
    let output = Command::new(prog)
        .args(&cmd[1..])
        .output()
        .map_err(|e| format!("Command failed: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    if output.status.success() {
        Ok(stdout)
    } else {
        Err(if stderr.is_empty() { stdout } else { stderr })
    }
}
