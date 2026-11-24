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
  // The speed tests (tests/speed/) run on their own after the rest (`npm test`), so that the
  // other test files, running at the same time, do not slow them down.
  test: process.env.SPEED_TESTS ? { include: ['tests/speed/*.test.ts'] } : { include: ['tests/**/*.test.ts'], exclude: ['tests/speed/**', 'node_modules/**'] },
} as never);
