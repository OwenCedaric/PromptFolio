import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [
      react(),
      // Removed vite-plugin-compression: 
      // Cloudflare Pages automatically handles Gzip and Brotli compression at the edge.
      // This ensures we upload only the necessary artifacts and rely on standard content-hashing for caching.
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
          // Explicitly organize output into folders for cleaner structure and easier cache debugging
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          
          assetFileNames: ({name}) => {
            if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
                return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.css$/.test(name ?? '')) {
                return 'assets/css/[name]-[hash][extname]';
            }
            // Fonts: Keep hash to ensure cache busting if you upgrade @fontsource packages,
            // but keep them organized in a specific folder. 
            // Since hashing is content-based, these filenames WILL be stable across builds if dependencies don't change.
            if (/\.(woff|woff2|eot|ttf|otf)$/.test(name ?? '')) {
                return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          
          manualChunks: {
            // Split core React dependencies
            'vendor-react': ['react', 'react-dom'],
            // Split icons (large SVG paths)
            'vendor-icons': ['@remixicon/react'],
            // Heavy markdown libraries - loaded lazily via React.lazy in PromptDetail
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