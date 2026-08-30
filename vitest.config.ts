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
    // Vitest 4 (ver migration guide: pool reescrito sin tinypool):
    // `poolOptions.threads.singleThread` se reemplaza por la opción
    // top-level `maxWorkers: 1` para conservar el orden determinístico
    // de ejecución de los tests. NO usamos `isolate: false` porque
    // compartiría módulos entre archivos y rompería los mocks de
    // `vi.mock` (ver caveat de la doc de migración).
    // https://vitest.dev/guide/migration#pool-rework
    pool: 'threads',
    maxWorkers: 1,
  },
});
