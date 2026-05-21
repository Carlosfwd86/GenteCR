// Vite config: React plugin + dev server en 5173 + build multi-página.
// '/' sirve la landing GenteCR (index.html); '/chat/' sirve el chatbot React (chat/index.html).
import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
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
