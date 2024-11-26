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
