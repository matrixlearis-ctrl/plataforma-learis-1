import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Separa as bibliotecas (node_modules) do código do seu app
        // Isso resolve o aviso de "chunks larger than 500kB"
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Aumenta o limite do aviso para 1000kB, já que o app é rico em funcionalidades
    chunkSizeWarningLimit: 1000
  }
});