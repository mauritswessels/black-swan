import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The Mac app (Tauri) expects the dev server on this exact port.
  server: { port: 1420, strictPort: true },
  clearScreen: false,
  test: { include: ['tests/**/*.test.ts'] },
} as never);
