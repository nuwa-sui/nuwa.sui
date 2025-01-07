import { defineConfig } from 'tsup'
// import AutoImport from 'unplugin-auto-import/esbuild'
// import { AutoImportOptions } from './autoImport.ts'

export default defineConfig({
    name: 'move-ts',
    entry: ['src/index.ts'],
    target: ['node20'],
    format: ['esm', 'cjs'],
    dts: true,
    keepNames: true,
    outDir: 'dist',
    treeshake: true,
    // esbuildPlugins: [AutoImport(AutoImportOptions)],
})
