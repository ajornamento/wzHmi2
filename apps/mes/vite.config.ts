import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@wzhmi/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@wzhmi/widgets': path.resolve(__dirname, '../../packages/widgets/src/index.ts'),
      '@viewer': path.resolve(__dirname, '../viewer/src'),
    },
  },
});
