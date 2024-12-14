import { tokenizeMove } from '@'

it('should normal function be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove(`public(package) entry fun test<T: key + store>(value: &mut T): T {}`)
    const [name, func] = parser.parseFunction(astContext)!
    expect(name).toBe('test')
    expect(func).toMatchObject({
        target: `${astContext.info.packageName}::${astContext.info.moduleName}::${name}`,
        modifiers: ['public(package)', 'entry'],
        generics: [{
            abilities: ['key', 'store'],
            name: 'T',
            phantom: false,
        }],
        params: {
            value: {
                generics: [],
                ref: 'mut_borrow',
                resource: {
                    type: 'generic',
                    name: 'T',
                },
            },
        },
        returns: [{
            generics: [],
            ref: 'value',
            resource: {
                type: 'generic',
                name: 'T',
            },
        }],
    })
})

it('should macro functions will be ignore', ({ parser, astContext }) => {
    parser.input = tokenizeMove(
        `public macro fun num_sqrt<$T, $U>($x: $T, $bitsize: u8): $T {
            ...
        }`,
    )
    const rst = parser.parseFunction(astContext)
    expect(rst).toBeNull()
})
