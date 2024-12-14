import { tokenizeMove } from '@'

it('should normal enum be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove(
        `public enum Bar<phantom T> has copy, drop {
            A (u64, bool),
            B {
                value: T,
            },
            C
        }`,
    )
    const [name, enum_] = parser.parseEnum(astContext)
    expect(name).toBe('Bar')
    expect(enum_).toMatchObject({
        type: 'enum',
        public: true,
        target: 'testPackage::testModule::Bar',
        abilities: ['copy', 'drop'],
        generics: [{ name: 'T', abilities: [], phantom: true }],
        fields: {
            A: {
                type: 'tuple',
                fields: [
                    { ref: 'value', resource: { type: 'primitive', target: 'u64' }, generics: [] },
                    {
                        ref: 'value',
                        resource: { type: 'primitive', target: 'bool' },
                        generics: [],
                    },
                ],
            },
            B: {
                type: 'struct',
                fields: { value: { ref: 'value', resource: { type: 'generic', name: 'T', abilities: [] }, generics: [] } },
            },
            C: {
                type: 'single',
            },
        },
    })
})
