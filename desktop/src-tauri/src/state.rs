use std::collections::HashMap;
use std::sync::Mutex;

pub struct AppState {
    pub server_url: Mutex<String>,
    pub access_token: Mutex<Option<String>>,
    pub refresh_token: Mutex<Option<String>>,
    pub user_id: Mutex<Option<String>>,
    pub username: Mutex<Option<String>>,
    pub role: Mutex<Option<String>>,
    pub active_workspace_id: Mutex<Option<String>>,
    pub workspace_root: Mutex<String>,
    pub file_cache: Mutex<HashMap<String, String>>,
    pub arduino_cli_path: Mutex<Option<String>>,
    pub device_id: Mutex<Option<String>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            server_url: Mutex::new(String::from("http://localhost:8443")),
            access_token: Mutex::new(None),
            refresh_token: Mutex::new(None),
            user_id: Mutex::new(None),
            username: Mutex::new(None),
            role: Mutex::new(None),
            active_workspace_id: Mutex::new(None),
            workspace_root: Mutex::new(
                dirs::document_dir()
                    .unwrap_or_else(|| std::path::PathBuf::from("."))
                    .join("CreateLab")
                    .to_string_lossy()
                    .to_string(),
            ),
            file_cache: Mutex::new(HashMap::new()),
            arduino_cli_path: Mutex::new(None),
            device_id: Mutex::new(None),
        }
    }
}
