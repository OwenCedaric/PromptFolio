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
        deleteOriginFile: false, // Explicitly keep original files
      }),
      {
        name: 'ensure-favicon',
        closeBundle() {
          // Manually copy favicon.svg to dist to guarantee the raw file exists
          // This ensures external links always have access to the uncompressed original
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
          // Manual chunks to optimize bundle size and caching
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['@remixicon/react', 'react-markdown', 'remark-gfm'],
            'vendor-ai': ['@google/genai'],
          }
        }
      }
    },
    define: {
      'process.env': JSON.stringify(env)
    }
  };
});