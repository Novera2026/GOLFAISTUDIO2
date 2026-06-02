import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  return {
    base: '/GOLFAISTUDIO2/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY || ''),
      'process.env.GOOGLE_API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
