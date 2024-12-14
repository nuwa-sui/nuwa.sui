import * as path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'
import AutoImportOptions from './autoImport.ts'

export default defineConfig({
    plugins: [
        AutoImport(AutoImportOptions),
    ],
    test: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        name: 'move-ast',
        globals: true,
        setupFiles: path.resolve(__dirname, 'tests/setup.ts'),

    },
})
