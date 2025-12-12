import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [
      react(),
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
        deleteOriginFile: false, 
      }),
      {
        name: 'ensure-favicon',
        closeBundle() {
          const root = (process as any).cwd();
          const src = resolve(root, 'favicon.svg');
          const destDir = resolve(root, 'dist');
          const dest = resolve(destDir, 'favicon.svg');
          
          if (existsSync(src) && existsSync(destDir)) {
             copyFileSync(src, dest);
             console.log('✓ Copied raw favicon.svg to dist');
          }
        }
      }
    ],
    build: {
      outDir: 'dist',
      minify: 'esbuild',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split core React vendor to cache it longer
            'vendor-react': ['react', 'react-dom'],
            // Split icons as they are large svg paths
            'vendor-icons': ['@remixicon/react'],
            // Heavy markdown parsing logic loaded lazily
            'vendor-markdown': ['react-markdown', 'remark-gfm'],
            // AI SDK
            'vendor-genai': ['@google/genai']
          }
        }
      }
    },
    define: {
      'process.env': JSON.stringify(env)
    }
  };
});