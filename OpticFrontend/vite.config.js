import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy para peticiones de API
      '/api': {
        target: 'http://api_optic:8080', // Usa el nombre del contenedor
        changeOrigin: true,
        secure: false,
      },
      // Proxy para peticiones de autenticación
      '/auth': {
        target: 'http://api_optic:8080', // Usa el nombre del contenedor
        changeOrigin: true,
        secure: false,
      }
    },
    host: true, // Permite que el contenedor escuche en todas las IPs
    allowedHosts: ['optica-v3.local', 'srv-optica-v3.local'], // Agregamos tus dominios
    port: 5173,
    watch: {
      usePolling: true, // Necesario para que Docker detecte cambios en Windows
    }
  }
})
