import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Mirror the nginx proxy locally so /abs-api/* hits the ABS server in dev.
      // Set ABS_SERVER_URL in the shell, or edit the default below.
      '/abs-api': {
        target: process.env.ABS_SERVER_URL ?? 'http://localhost:13378',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/abs-api/, '/api'),
      },
      '/abs-socket': {
        target: process.env.ABS_SERVER_URL ?? 'http://localhost:13378',
        changeOrigin: true,
        ws: true,
        rewrite: (p) => p.replace(/^\/abs-socket/, ''),
      },
    },
  },
})
