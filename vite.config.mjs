import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  base: process.env.VITE_APP_BASENAME || '/qaraaoun',
  plugins: [react()],
  server: {    
    open: true,
    port: 3000, 
  },
  build: {
    rollupOptions: {
      plugins: [
        visualizer({
          filename: './dist/report.html',
        })
      ],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('src/components')) {
            return 'components';
          }
        }
      }
    },
    chunkSizeWarningLimit: 3000,
  }
});



