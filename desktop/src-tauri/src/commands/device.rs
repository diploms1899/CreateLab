use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::hardware::generate_device_id;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub id: String,
    pub device_id: String,
    pub trust_status: String,
    pub is_approved: bool,
}

#[tauri::command]
pub async fn get_device_id(state: State<'_, AppState>) -> Result<String, String> {
    let (device_id, _fingerprint) = generate_device_id();
    *state.device_id.lock().unwrap() = Some(device_id.clone());
    Ok(device_id)
}

#[tauri::command]
pub async fn register_device(state: State<'_, AppState>, friendly_name: String) -> Result<DeviceInfo, String> {
    let server_url = state.server_url.lock().unwrap().clone();
    let token = state.access_token.lock().unwrap().clone().ok_or("Not authenticated")?;
    let (device_id, fingerprint) = generate_device_id();
    let secure_key = uuid::Uuid::new_v4().to_string();

    let client = Client::new();
    let response = client
        .post(format!("{}/api/v1/devices/register", server_url))
        .bearer_auth(&token)
        .json(&serde_json::json!({
            "device_id": device_id,
            "friendly_name": friendly_name,
            "os_name": std::env::consts::OS,
            "os_version": "",
            "hardware_fingerprint": fingerprint,
            "secure_key": secure_key,
        }))
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    let info: DeviceInfo = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
    Ok(info)
}
