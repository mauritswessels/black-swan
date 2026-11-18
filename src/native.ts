/**
 * The bridge to the Mac app (Tauri). Everything that only works inside the app goes through
 * here, so the same game also runs in a plain browser: there these functions do nothing.
 */
import { invoke as tauriInvoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWebview } from '@tauri-apps/api/webview';

/** True inside the Mac app, false in a browser or a test. */
export const inApp = (): boolean => {
  try {
    return isTauri();
  } catch {
    return false;
  }
};

/** Run one of the app's own commands (see src-tauri/src/lib.rs). */
export function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return tauriInvoke<T>(cmd, args);
}

let menuHooked = false;
/** Called with "settings" or "check-updates" when the player picks that item in the Black Swan menu. */
export function onMenu(handler: (id: string) => void): void {
  if (!inApp() || menuHooked) return;
  menuHooked = true;
  void listen<string>('menu', (e) => handler(e.payload)).catch(() => undefined);
}

/** Make everything in the window bigger or smaller (1 = normal). Only the app can do this. */
export async function setZoom(scale: number): Promise<boolean> {
  if (!inApp()) return false;
  try {
    await getCurrentWebview().setZoom(scale);
    return true;
  } catch {
    return false;
  }
}

/** The version of this build, from package.json. */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
