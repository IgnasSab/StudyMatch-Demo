import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: { 'import.meta.env.VITE_DEMO_MODE': JSON.stringify(mode === 'demo') },
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
}));
