import { defineConfig } from 'waku/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      port: 3000,
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/*.gen.ts'],
        usePolling: false,
      },
    },
  },
});
