import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  // Preprocess Svelte files with Vite
  preprocess: vitePreprocess(),

  compilerOptions: {
    // Enable runes mode (Svelte 5)
    runes: true
  }
};
