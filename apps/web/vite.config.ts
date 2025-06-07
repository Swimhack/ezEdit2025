import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
// For Netlify deployment - detect if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// For troubleshooting missing files or blank screens
console.log('Starting Vite config with mode:', process.env.NODE_ENV || 'development');

export default defineConfig({
  // Force enable logs for troubleshooting
  logLevel: 'info',
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
  // Ensure proper base path for assets in production
  base: '/',
  
  build: {
    outDir: 'dist',
    // Ensure clean build for Netlify
    emptyOutDir: true,
    // Improve error reporting
    reportCompressedSize: false,
    minify: 'terser',
    // Force rollup to include assets in build
    assetsInlineLimit: 0,
    // Exclude the incompatible app directory from the build
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
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
