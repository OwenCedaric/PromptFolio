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
        name: 'ensure-assets',
        closeBundle() {
          const root = (process as any).cwd();
          const destDir = resolve(root, 'dist');
          
          // Files to manually copy to root of dist
          const filesToCopy = ['favicon.svg', 'manifest.json'];

          filesToCopy.forEach(file => {
             const src = resolve(root, file);
             const dest = resolve(destDir, file);
             if (existsSync(src) && existsSync(destDir)) {
                copyFileSync(src, dest);
                console.log(`✓ Copied raw ${file} to dist`);
             }
          });
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