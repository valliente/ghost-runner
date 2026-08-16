use std::fs::File;
use std::io::Write;

#[tauri::command]
async fn save_workout_log(file_path: String, content: String) -> Result<String, String> {
  let mut file = File::create(&file_path).map_err(|e| format!("Failed to create file: {}", e))?;
  file.write_all(content.as_bytes()).map_err(|e| format!("Failed to write content: {}", e))?;
  Ok(format!("Workout successfully saved to {}", file_path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![save_workout_log])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
