import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const absTarget = env.ABS_SERVER_URL ?? 'http://localhost:13378'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        // Mirror the production nginx proxy: /abs-api/* maps to the ABS origin
        // root. ABS auth routes live at the root (/login, /api/authorize), so we
        // strip only the /abs-api prefix and forward the rest verbatim.
        '/abs-api': {
          target: absTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/abs-api/, ''),
        },
        '/abs-socket': {
          target: absTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (p) => p.replace(/^\/abs-socket/, ''),
        },
      },
    },
  }
})
