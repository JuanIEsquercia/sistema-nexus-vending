import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configuración para GitHub Pages
  base: process.env.NODE_ENV === 'production' ? '/sistema-nexus-vending/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
