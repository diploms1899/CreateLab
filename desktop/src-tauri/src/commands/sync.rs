use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncStatus {
    pub workspace_id: String,
    pub version: i32,
    pub last_synced: Option<String>,
}

#[tauri::command]
pub async fn push_changes(state: State<'_, AppState>, workspace_id: String, base_version: i32) -> Result<i32, String> {
    let server_url = state.server_url.lock().unwrap().clone();
    let token = state.access_token.lock().unwrap().clone().ok_or("Not authenticated")?;
    let files = {
        state.file_cache.lock().unwrap().clone()
    };
    let client = Client::new();
    let response = client
        .post(format!("{}/api/v1/sync/push/{}", server_url, workspace_id))
        .bearer_auth(&token)
        .json(&serde_json::json!({"files": files, "base_version": base_version}))
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    let data: serde_json::Value = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
    Ok(data["version"].as_i64().unwrap_or(0) as i32)
}

#[tauri::command]
pub async fn pull_changes(state: State<'_, AppState>, workspace_id: String) -> Result<HashMap<String, String>, String> {
    let server_url = state.server_url.lock().unwrap().clone();
    let token = state.access_token.lock().unwrap().clone().ok_or("Not authenticated")?;
    let client = Client::new();
    let response = client
        .post(format!("{}/api/v1/sync/pull/{}", server_url, workspace_id))
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    let data: serde_json::Value = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
    let files: HashMap<String, String> = serde_json::from_value(data["files"].clone()).unwrap_or_default();
    let mut cache = state.file_cache.lock().unwrap();
    cache.extend(files.clone());
    Ok(files)
}

#[tauri::command]
pub async fn get_sync_status(state: State<'_, AppState>, workspace_id: String) -> Result<SyncStatus, String> {
    let server_url = state.server_url.lock().unwrap().clone();
    let token = state.access_token.lock().unwrap().clone().ok_or("Not authenticated")?;
    let client = Client::new();
    let response = client
        .get(format!("{}/api/v1/sync/status/{}", server_url, workspace_id))
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    let status: SyncStatus = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
    Ok(status)
}
