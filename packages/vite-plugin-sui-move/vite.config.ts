import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [
        AutoImport({
            imports: ['vitest'],
            dts: true, // generate TypeScript declaration
        }),
    ],
    publicDir: false,
    test: {
        globals: true,
    },
    resolve: {
        alias: {
            '@ast': path.resolve(__dirname, 'ast'),
        },
    },
    build: {
        lib: {
            entry: 'index.ts',
            name: '@nuwa.sui/vite-plugin-sui-move',
            fileName: 'index',
        },
        rollupOptions: {
            external: ['@mysten/sui'],
        },
    },
})
