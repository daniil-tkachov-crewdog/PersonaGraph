import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the Electron renderer.
// - base './' so the built assets load from file:// inside the packaged app.
// - fixed port 5173 because electron/main.js waits on that exact port in dev.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true }
});
