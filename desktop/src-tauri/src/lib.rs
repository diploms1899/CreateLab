use tauri::Manager;

mod commands;
mod hardware;
mod state;
mod error;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .manage(AppState::new())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            #[cfg(debug_assertions)]
            window.open_devtools();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth::login,
            commands::auth::register,
            commands::auth::refresh_token,
            commands::auth::logout,
            commands::workspace::list_workspaces,
            commands::workspace::create_workspace,
            commands::workspace::read_file,
            commands::workspace::write_file,
            commands::workspace::delete_file,
            commands::workspace::scan_workspace,
            commands::arduino::detect_arduino,
            commands::arduino::compile,
            commands::arduino::upload,
            commands::arduino::list_boards,
            commands::arduino::serial_monitor,
            commands::sync::push_changes,
            commands::sync::pull_changes,
            commands::sync::get_sync_status,
            commands::device::get_device_id,
            commands::device::register_device,
        ])
        .run(tauri::generate_context!())
        .expect("error while running CreateLab");
}
