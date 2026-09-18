import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gaId = env.VITE_GA_MEASUREMENT_ID || '';

  return {
    plugins: [
      react(),
      {
        name: 'inject-ga-id',
        transformIndexHtml(html) {
          return html.replace('__VITE_GA_ID__', gaId);
        },
      },
    ],
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    css: {
      preprocessorOptions: {},
    },
  };
});
