import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { webSocketErrorHandler } from './vite-plugins/webSocketErrorHandler.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    webSocketErrorHandler() // Custom plugin for WebSocket error handling
  ],
  server: {
    host: '127.0.0.1', // Use specific localhost IP instead of true
    port: 5173,
    strictPort: false, // Allow fallback ports if 5173 is busy
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/user': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/auction': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    },
    hmr: process.env.DISABLE_HMR === 'true' ? false : {
      port: 5174, // Use different port for HMR to avoid conflicts
      host: '127.0.0.1',
      clientPort: 5174,
      overlay: false,
      timeout: 30000, // Increase timeout
    },
    watch: {
      usePolling: true,
      interval: 300, // Polling interval
    },
    // Disable HTTPS to avoid certificate issues
    https: false,
  },
  preview: {
    port: 5173,
    strictPort: false,
  },
  // Optimize dependencies to reduce HMR load
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router'],
  },
})
