import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    // Forzar NODE_ENV=test garantiza que React cargue el build de desarrollo,
    // que sí expone `act`. Sin esto, si el shell tiene NODE_ENV=production
    // (común en proyectos con pnpm build o deploys), vitest hereda ese
    // valor y los tests de componentes fallan con
    // `TypeError: React.act is not a function`.
    // Referencia: https://github.com/testing-library/react-testing-library/issues/1399
    env: {
      NODE_ENV: 'test',
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
