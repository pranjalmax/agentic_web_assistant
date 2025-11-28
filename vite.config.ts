import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    plugins: [
        react(),
        {
            name: 'post-build',
            closeBundle() {
                // Copy manifest
                copyFileSync('manifest.json', 'dist/manifest.json');

                // Copy icons
                if (!existsSync('dist/icons')) {
                    mkdirSync('dist/icons', { recursive: true });
                }
                const icons = ['icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-128.png'];
                icons.forEach(icon => {
                    if (existsSync(`public/icons/${icon}`)) {
                        copyFileSync(`public/icons/${icon}`, `dist/icons/${icon}`);
                    }
                });

                // Move HTML files from dist/src to dist root if they exist
                if (existsSync('dist/src/popup/index.html')) {
                    copyFileSync('dist/src/popup/index.html', 'dist/popup.html');
                }
                if (existsSync('dist/src/options/index.html')) {
                    copyFileSync('dist/src/options/index.html', 'dist/options.html');
                }

                console.log('✅ Extension files ready in dist/');
            },
        },
    ],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'src/popup/index.html'),
                options: resolve(__dirname, 'src/options/index.html'),
                background: resolve(__dirname, 'src/background/index.ts'),
                content: resolve(__dirname, 'src/content/index.ts'),
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    // Content and background MUST be standalone files
                    if (chunkInfo.name === 'background' || chunkInfo.name === 'content') {
                        return '[name].js';
                    }
                    return 'assets/[name]-[hash].js';
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
            },
            // Prevent code splitting for content and background
            preserveEntrySignatures: 'strict',
        },
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
