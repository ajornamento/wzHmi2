import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@wzhmi/core': '/packages/core/src/index.ts',
      '@wzhmi/widgets': '/packages/widgets/src/index.ts',
      '@viewer': path.resolve(__dirname, '../viewer/src'),
    },
  },
});
