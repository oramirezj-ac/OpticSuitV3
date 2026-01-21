import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite que el contenedor escuche en todas las IPs
    allowedHosts: ['optica-v3.local', 'srv-optica-v3.local'], // Agregamos tus dominios
    port: 5173,
    watch: {
      usePolling: true, // Necesario para que Docker detecte cambios en Windows
    }
  }
})
