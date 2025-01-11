import antfu from '@antfu/eslint-config'

export default antfu({
    type: 'lib',
    stylistic: {
        indent: 4, // 4, or 'tab'
        quotes: 'single', // or 'double'
    },
    typescript: true,
    vue: true,
    jsonc: true,
    yaml: false,
    ignores: [
        '**/**.temp.*s',
    ],
    rules: {
        'eslint-comments/no-unlimited-disable': 'off',
    },
})
