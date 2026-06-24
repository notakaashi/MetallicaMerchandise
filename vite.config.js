import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  root: resolve(__dirname, 'src/frontend'),
  build: {
    outDir: resolve(__dirname, 'public'),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/frontend/js/main.js'),
        admin: resolve(__dirname, 'src/frontend/js/admin.js'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/[name][extname]';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
};
