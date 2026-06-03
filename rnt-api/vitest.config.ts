import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    setupFiles: ['./test/test.setup.ts'],
    globalTeardown: ['./test/global-teardown.ts'],
    globals: true,
  },
});
