// Vite config: React plugin + dev server en 5173 + build multi-página.
// '/' sirve la landing GenteCR (index.html); '/chat/' sirve el chatbot React (chat/index.html).
import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // root apunta al directorio del frontend para que Vite sirva index.html en '/'
  root: resolve(__dirname),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  optimizeDeps: {
    // Evita la advertencia "Could not auto-determine entry point"
    entries: ['index.html', 'chat/index.html'],
  },
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        chat: resolve(__dirname, 'chat/index.html'),
      },
    },
  },
});
