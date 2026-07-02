use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user_id: String,
    pub username: String,
    pub display_name: String,
    pub role: String,
}

#[tauri::command]
pub async fn login(state: State<'_, AppState>, request: LoginRequest) -> Result<TokenResponse, String> {
    let server_url = state.server_url.lock().unwrap().clone();
    let client = Client::new();
    let response = client
        .post(format!("{}/api/v1/auth/login", server_url))
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    if !response.status().is_success() {
        let detail = response.text().await.unwrap_or_default();
        return Err(format!("Login failed: {}", detail));
    }
    let token: TokenResponse = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
    *state.access_token.lock().unwrap() = Some(token.access_token.clone());
    *state.refresh_token.lock().unwrap() = Some(token.refresh_token.clone());
    *state.user_id.lock().unwrap() = Some(token.user_id.clone());
    *state.username.lock().unwrap() = Some(token.username.clone());
    *state.role.lock().unwrap() = Some(token.role.clone());
    Ok(token)
}

#[tauri::command]
pub async fn register(state: State<'_, AppState>, username: String, password: String, email: String) -> Result<TokenResponse, String> {
    let server_url = state.server_url.lock().unwrap().clone();
    let client = Client::new();
    let response = client
        .post(format!("{}/api/v1/auth/register", server_url))
        .json(&serde_json::json!({"username": username, "password": password, "email": email}))
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    if !response.status().is_success() {
        return Err("Registration failed".into());
    }
    let token: TokenResponse = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
    *state.access_token.lock().unwrap() = Some(token.access_token.clone());
    *state.refresh_token.lock().unwrap() = Some(token.refresh_token.clone());
    *state.user_id.lock().unwrap() = Some(token.user_id.clone());
    Ok(token)
}

#[tauri::command]
pub async fn refresh_token(state: State<'_, AppState>) -> Result<TokenResponse, String> {
    let server_url = state.server_url.lock().unwrap().clone();
    let refresh = state.refresh_token.lock().unwrap().clone().ok_or("No refresh token")?;
    let client = Client::new();
    let response = client
        .post(format!("{}/api/v1/auth/refresh", server_url))
        .json(&serde_json::json!({"refresh_token": refresh}))
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;
    let token: TokenResponse = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
    *state.access_token.lock().unwrap() = Some(token.access_token.clone());
    *state.refresh_token.lock().unwrap() = Some(token.refresh_token.clone());
    Ok(token)
}

#[tauri::command]
pub async fn logout(state: State<'_, AppState>) -> Result<(), String> {
    *state.access_token.lock().unwrap() = None;
    *state.refresh_token.lock().unwrap() = None;
    *state.user_id.lock().unwrap() = None;
    *state.username.lock().unwrap() = None;
    *state.role.lock().unwrap() = None;
    *state.active_workspace_id.lock().unwrap() = None;
    Ok(())
}
