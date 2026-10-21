import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, /api y /storage se reenvian al backend; en produccion lo hace nginx.
// Asi el frontend siempre usa rutas relativas y no necesita conocer la URL del backend.
const backend = process.env.BACKEND_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  // Prisma Studio (backend) trae React 18 y npm lo eleva a la raiz del monorepo; sin esto,
  // las librerias elevadas (TanStack Query) usarian esa copia y React fallaria con dos copias.
  resolve: { dedupe: ['react', 'react-dom'] },
  server: {
    host: true,
    port: 5173,
    // En un bind mount de Windows los eventos de archivos no llegan al contenedor
    watch: { usePolling: true },
    proxy: {
      '/api': backend,
      '/storage': backend,
    },
  },
});
