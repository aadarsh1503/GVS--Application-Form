import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: 'build',
  },
  server: {
    proxy: {
      // Proxy all requests starting with /api to your backend server at localhost:5000
      '/api': 'http://localhost:5000',
    },
  },
})
