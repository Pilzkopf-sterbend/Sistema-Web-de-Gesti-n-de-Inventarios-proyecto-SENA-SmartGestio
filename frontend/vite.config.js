// Qué hace: Configura el servidor de desarrollo de Vite.
// Para qué sirve: Compilar React y enviar las peticiones /api al backend.

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Para qué sirve: Evitar problemas de CORS durante el desarrollo local.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});