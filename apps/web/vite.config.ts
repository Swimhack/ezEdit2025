import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
    watch: {
      usePolling: true,
    },
    // Proxy API requests to the backend server
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    // @ts-expect-error - configureServer is allowed by Vite runtime even if not typed
    configureServer(server) {
      // Set cache headers
      server.middlewares.use((_req: any, res: any, next: any) => {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Pragma', 'no-cache');
        next();
      });
    },
  },
  build: {
    outDir: 'dist',
    // Ensure clean build for Netlify
    emptyOutDir: true,
    // Improve error reporting
    reportCompressedSize: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
})
