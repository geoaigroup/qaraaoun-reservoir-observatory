import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import {visualizer} from 'rollup-plugin-visualizer';


export default defineConfig({
    base: '/qaraaoun',
    plugins: [react()],
    server: {    
        // this ensures that the browser opens upon server start
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
      chunkSizeWarningLimit: 3000, // Adjust the limit as needed
    }
})

