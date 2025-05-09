import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
    exclude: [
      '@duckdb/duckdb-wasm',
    ],
  },
  build: {
    target: 'esnext'
  }
});
