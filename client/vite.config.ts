import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import svgr from 'vite-plugin-svgr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Vite configuration
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
   
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
