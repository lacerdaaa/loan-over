import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const VENDOR_CHUNKS: Record<string, string> = {
  recharts: 'recharts',
  'framer-motion': 'framer-motion',
};

const vendorChunk = (id: string): string | undefined => {
  if (!id.includes('node_modules')) return undefined;
  return Object.keys(VENDOR_CHUNKS).find((pkg) => id.includes(`/node_modules/${pkg}/`));
};

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: { manualChunks: vendorChunk },
    },
  },
});
