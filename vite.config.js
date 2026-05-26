// 루트 멀티페이지 Vite 설정 — mes/editor/viewer를 단일 포트로 통합
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  publicDir: 'apps/mes/public',
  resolve: {
    alias: {
      '@wzhmi/core': path.resolve(__dirname, 'packages/core/src/index.js'),
      '@wzhmi/widgets': path.resolve(__dirname, 'packages/widgets/src/index.js'),
      '@viewer': path.resolve(__dirname, 'apps/viewer/src'),
    },
  },
  server: {
    port: 5173,
  },
  plugins: [
    {
      name: 'app-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/apps/mes' || req.url === '/apps/editor' || req.url === '/apps/viewer') {
            res.writeHead(301, { Location: req.url + '/' });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        mes: path.resolve(__dirname, 'apps/mes/index.html'),
        editor: path.resolve(__dirname, 'apps/editor/index.html'),
        viewer: path.resolve(__dirname, 'apps/viewer/index.html'),
      },
    },
  },
});
