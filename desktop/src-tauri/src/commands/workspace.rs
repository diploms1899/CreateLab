use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceInfo {
    pub id: String,
    pub name: String,
    pub template_id: String,
    pub sync_version: i32,
}

#[tauri::command]
pub async fn list_workspaces(state: State<'_, AppState>) -> Result<Vec<WorkspaceInfo>, String> {
    let server_url = state.server_url.lock().unwrap().clone();
    let token = state.access_token.lock().unwrap().clone().ok_or("Not authenticated")?;
    let client = Client::new();
    let response = client
        .get(format!("{}/api/v1/workspaces", server_url))
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    let workspaces: Vec<WorkspaceInfo> = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
    Ok(workspaces)
}

#[tauri::command]
pub async fn create_workspace(state: State<'_, AppState>, template_slug: String, name: String) -> Result<serde_json::Value, String> {
    let server_url = state.server_url.lock().unwrap().clone();
    let token = state.access_token.lock().unwrap().clone().ok_or("Not authenticated")?;
    let client = Client::new();
    let response = client
        .post(format!("{}/api/v1/workspaces", server_url))
        .bearer_auth(&token)
        .json(&serde_json::json!({"template_slug": template_slug, "name": name}))
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    let ws: serde_json::Value = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
    *state.active_workspace_id.lock().unwrap() = Some(ws["id"].as_str().unwrap_or("").to_string());
    Ok(ws)
}

#[tauri::command]
pub async fn read_file(state: State<'_, AppState>, workspace_id: String, path: String) -> Result<String, String> {
    {
        let cache = state.file_cache.lock().unwrap();
        if let Some(content) = cache.get(&path) {
            return Ok(content.clone());
        }
    }
    let server_url = state.server_url.lock().unwrap().clone();
    let token = state.access_token.lock().unwrap().clone().ok_or("Not authenticated")?;
    let client = Client::new();
    let response = client
        .get(format!("{}/api/v1/workspaces/{}/files", server_url, workspace_id))
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    let data: serde_json::Value = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
    Ok(data["files"].get(&path).and_then(|v| v.as_str()).unwrap_or("").to_string())
}

#[tauri::command]
pub async fn write_file(state: State<'_, AppState>, workspace_id: String, path: String, content: String) -> Result<(), String> {
    {
        let mut cache = state.file_cache.lock().unwrap();
        cache.insert(path.clone(), content.clone());
    }
    let server_url = state.server_url.lock().unwrap().clone();
    let token = state.access_token.lock().unwrap().clone().ok_or("Not authenticated")?;
    let client = Client::new();
    client
        .put(format!("{}/api/v1/workspaces/{}/files/{}", server_url, workspace_id, path))
        .bearer_auth(&token)
        .query(&[("content", &content)])
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn delete_file(state: State<'_, AppState>, workspace_id: String, path: String) -> Result<(), String> {
    {
        let mut cache = state.file_cache.lock().unwrap();
        cache.remove(&path);
    }
    let server_url = state.server_url.lock().unwrap().clone();
    let token = state.access_token.lock().unwrap().clone().ok_or("Not authenticated")?;
    let client = Client::new();
    client
        .delete(format!("{}/api/v1/workspaces/{}/files/{}", server_url, workspace_id, path))
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn scan_workspace(state: State<'_, AppState>, _path: String) -> Result<HashMap<String, String>, String> {
    let cache = state.file_cache.lock().unwrap();
    Ok(cache.clone())
}
