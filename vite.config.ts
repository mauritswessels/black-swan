import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  plugins: [react()],
  // The game shows its own version (title screen, Settings); it comes from package.json.
  define: { __APP_VERSION__: JSON.stringify(version) },
  // The Mac app (Tauri) expects the dev server on this exact port.
  server: { port: 1420, strictPort: true },
  clearScreen: false,
  test: { include: ['tests/**/*.test.ts'] },
} as never);
