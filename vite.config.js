import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
});
