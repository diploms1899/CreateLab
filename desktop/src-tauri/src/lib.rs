
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
        .setup(|_app| Ok(()))
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
            commands::arduino::list_boards,
            commands::arduino::list_ports,
            commands::arduino::compile_sketch,
            commands::arduino::upload_sketch,
            commands::arduino::serial_monitor,
            commands::arduino::list_libraries,
            commands::arduino::search_libraries,
            commands::arduino::install_library,
            commands::arduino::remove_library,
            commands::sync::push_changes,
            commands::sync::pull_changes,
            commands::sync::get_sync_status,
            commands::device::get_device_id,
            commands::device::register_device,
            commands::repo::scan_repo_health,
            commands::repo::run_shell_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running CreateLab");
}
