import { defineConfig } from 'vite'

export default defineConfig({
    publicDir: false,
    build: {
        lib:{
            entry: 'index.ts',
            name: '@nuwa.sui/core',
            fileName: 'index'
        },
        rollupOptions: {
            external: ['@mysten/sui']
        }
    }
})