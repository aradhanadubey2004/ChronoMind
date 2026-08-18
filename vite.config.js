import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function expressBackendPlugin() {
  return {
    name: 'express-backend',
    configureServer(server) {
      try {
        const dotenv = require('dotenv');
        dotenv.config({ path: path.join(__dirname, 'backend/.env') });
        dotenv.config({ path: path.join(__dirname, '.env') });

        const app = require('./backend/app');
        const connectDB = require('./backend/config/db');
        const { startRecordingCleanupScheduler } = require('./backend/services/recordingCleanupService');

        connectDB().catch((err) => console.warn('DB connect warning:', err.message));
        startRecordingCleanupScheduler();

        server.middlewares.use(app);
      } catch (err) {
        console.error('Express plugin startup error:', err);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressBackendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
