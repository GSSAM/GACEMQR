
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // لضمان عمل الروابط بشكل صحيح على GitHub Pages
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 3000,
  }
});
