import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  root: 'webview-svelte',
  build: {
    outDir: '../webview-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'webview-svelte/index.html'),
      output: {
        entryFileNames: 'bundle.js',
        chunkFileNames: 'chunk.[hash].js',
        assetFileNames: 'bundle.[ext]'
      }
    },
    // Optimize for VSCode webview
    minify: 'terser',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'webview-svelte/src')
    }
  }
});
