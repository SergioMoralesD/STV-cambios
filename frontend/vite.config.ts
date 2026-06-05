import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:4000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/auth': {
           target: backendUrl,
           changeOrigin: true
        },
        '/users': {
           target: backendUrl,
           changeOrigin: true
        },
        '/external-api': {
           target: backendUrl,
           changeOrigin: true
        },
        '/log-accesos': {
           target: backendUrl,
           changeOrigin: true
        },
        '/roles': {
           target: backendUrl,
           changeOrigin: true
        },
        '/vistas': {
           target: backendUrl,
           changeOrigin: true
        },
        '/system-logs': {
           target: backendUrl,
           changeOrigin: true
        },
        '/recursos-api': {
           target: backendUrl,
           changeOrigin: true
        },
        '/uploads': {
           target: backendUrl,
           changeOrigin: true
        },
        '/orders': {
           target: backendUrl,
           changeOrigin: true
        },
      },
    },
  };
})
  