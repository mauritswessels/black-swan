//! The Mac app around the game. The game itself is the web page in `src/`; this file only
//! adds what a web page cannot do on its own:
//! - save files in the app's own folder (~/Library/Application Support/app.blackswan.game/saves),
//! - updates (the updater plugin checks GitHub for a newer version, then restarts the app),
//! - a window that remembers its size and place,
//! - "Settings…" and "Check for Updates…" in the Black Swan menu.

use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, Emitter, Manager};

/// The only save slots there are. Anything else is refused, so a save can never be written
/// outside the saves folder.
const SLOTS: [&str; 4] = ["auto", "1", "2", "3"];

fn saves_dir(app: &AppHandle) -> Result<PathBuf, String> {
  let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("saves");
  fs::create_dir_all(&dir).map_err(|e| format!("cannot make the saves folder: {e}"))?;
  Ok(dir)
}

fn slot_file(app: &AppHandle, slot: &str) -> Result<PathBuf, String> {
  if !SLOTS.contains(&slot) {
    return Err(format!("there is no save slot called {slot:?}"));
  }
  Ok(saves_dir(app)?.join(format!("{slot}.json")))
}

/// Every save file there is, by slot.
#[tauri::command]
async fn read_saves(app: AppHandle) -> Result<HashMap<String, String>, String> {
  let mut out = HashMap::new();
  for slot in SLOTS {
    let path = slot_file(&app, slot)?;
    if path.exists() {
      let text = fs::read_to_string(&path).map_err(|e| format!("cannot read {}: {e}", path.display()))?;
      out.insert(slot.to_string(), text);
    }
  }
  Ok(out)
}

/// Write a save. It goes to a temporary file first and is then renamed, so a crash half way
/// through never leaves a broken save behind.
#[tauri::command]
async fn write_save(app: AppHandle, slot: String, contents: String) -> Result<(), String> {
  let path = slot_file(&app, &slot)?;
  let tmp = path.with_extension("json.part");
  fs::write(&tmp, contents).map_err(|e| format!("cannot write {}: {e}", tmp.display()))?;
  fs::rename(&tmp, &path).map_err(|e| format!("cannot finish {}: {e}", path.display()))?;
  Ok(())
}

#[tauri::command]
async fn delete_save(app: AppHandle, slot: String) -> Result<(), String> {
  let path = slot_file(&app, &slot)?;
  if path.exists() {
    fs::remove_file(&path).map_err(|e| format!("cannot delete {}: {e}", path.display()))?;
  }
  Ok(())
}

/// Where the saves are, to show in Settings.
#[tauri::command]
async fn saves_folder(app: AppHandle) -> Result<String, String> {
  Ok(saves_dir(&app)?.display().to_string())
}

/// Open the saves folder in Finder.
#[tauri::command]
async fn show_saves_folder(app: AppHandle) -> Result<(), String> {
  let dir = saves_dir(&app)?;
  let opener = if cfg!(target_os = "macos") {
    "open"
  } else if cfg!(target_os = "windows") {
    "explorer"
  } else {
    "xdg-open"
  };
  std::process::Command::new(opener).arg(&dir).spawn().map_err(|e| format!("cannot open the folder: {e}"))?;
  Ok(())
}

/// The standard Mac menu, plus Check for Updates… and Settings… under Black Swan.
#[cfg(target_os = "macos")]
fn add_menu(app: &tauri::App) -> tauri::Result<()> {
  use tauri::menu::{Menu, MenuItem, MenuItemKind};
  let handle = app.handle();
  let menu = Menu::default(handle)?;
  if let Some(MenuItemKind::Submenu(app_menu)) = menu.items()?.into_iter().next() {
    let updates = MenuItem::with_id(handle, "check-updates", "Check for Updates…", true, None::<&str>)?;
    let settings = MenuItem::with_id(handle, "settings", "Settings…", true, Some("CmdOrCtrl+,"))?;
    // Right under "About Black Swan".
    app_menu.insert(&updates, 1)?;
    app_menu.insert(&settings, 2)?;
  }
  app.handle().set_menu(menu)?;
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![read_saves, write_save, delete_save, saves_folder, show_saves_folder])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      #[cfg(target_os = "macos")]
      add_menu(app)?;
      Ok(())
    })
    // The game listens for "menu" and opens Settings or checks for updates.
    .on_menu_event(|app, event| {
      let _ = app.emit("menu", event.id().as_ref());
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
