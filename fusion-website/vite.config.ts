import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/demo/',
  server: {
    proxy: {
      '/ERP/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ERP\/api/, '/api/router.php'), // Bypass .htaccess for local PHP server
      }
    }
  }
})
