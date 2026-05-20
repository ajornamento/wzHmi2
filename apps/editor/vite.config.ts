import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
    alias: {
      '@wzhmi/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@wzhmi/widgets': path.resolve(__dirname, '../../packages/widgets/src/index.ts'),
    },
  },
});
