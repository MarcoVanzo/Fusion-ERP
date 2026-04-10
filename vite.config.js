import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite Configuration — Fusion ERP
 * 
 * CURRENT STATE: The frontend uses legacy <script> tags (non-module).
 * Vite is configured as a PROGRESSIVE build tool:
 *   - Phase 1 (now): CSS bundling + basic JS minification
 *   - Phase 2 (P2): Gradual ES module migration
 * 
 * Usage:
 *   npm run dev    → dev server with HMR (CSS only for now)
 *   npm run build  → production CSS bundle + copy assets
 */

export default defineConfig({
  root: '.',
  
  // Base URL for Aruba deployment
  base: './',
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    minify: 'esbuild',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        // Only CSS entry point for now — JS stays legacy <script>
        style: resolve(__dirname, 'css/style.css'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names && assetInfo.names[0]?.endsWith('.css')) {
            return 'css/[name]-[hash].css';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
  
  server: {
    port: 3000,
    open: '/index.html',
    
    // Proxy API calls to local PHP server
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  
  css: {
    devSourcemap: true,
  },
});
