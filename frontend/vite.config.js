// Vite config: React plugin + dev server en 5173 + build multi-página.
// '/' sirve la landing GenteCR (index.html); '/chat/' sirve el chatbot React (chat/index.html).
import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        chat: resolve(__dirname, 'chat/index.html'),
      },
    },
  },
});
