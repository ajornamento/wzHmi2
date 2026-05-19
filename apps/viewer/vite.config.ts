import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@wzhmi/core': '/packages/core/src/index.ts',
      '@wzhmi/widgets': '/packages/widgets/src/index.ts',
    },
  },
});
