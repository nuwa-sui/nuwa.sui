import { tokenizeMove } from '@'
import { expect } from 'vitest'

it('should normal struct be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove(`public struct Test has key, store {
        value: u64,
    }`)
    const [name, struct] = parser.parseStruct(astContext)
    expect(name).toBe('Test')
    expect(struct).toMatchObject({
        type: 'struct',
        public: true,
        target: `${astContext.info.packageName}::${astContext.info.moduleName}::${name}`,
        fields: {
            value: {
                generics: [],
                ref: 'value',
                resource: astContext.resolveResources('u64'),
            },
        },
        abilities: ['key', 'store'],
        generics: [],
    })
})

it('should tuple struct be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove(`public struct PosBar (u64, u256) has key, store;`)
    const [name, struct] = parser.parseStruct(astContext)
    expect(name).toBe('PosBar')
    expect(struct).toMatchObject({
        type: 'struct',
        public: true,
        target: `${astContext.info.packageName}::${astContext.info.moduleName}::${name}`,
        fields: {
            0: {
                generics: [],
                ref: 'value',
                resource: astContext.resolveResources('u64'),
            },
            1: {
                generics: [],
                ref: 'value',
                resource: astContext.resolveResources('u256'),
            },
        },
        abilities: ['key', 'store'],
        generics: [],
    })
})

it('should struct with generics be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove(
        `public struct Test<phantom T> has key, store {
            value: T,
        }`,
    )
    const [name, struct] = parser.parseStruct(astContext)
    expect(name).toBe('Test')
    expect(struct).toMatchObject({
        type: 'struct',
        public: true,
        target: `${astContext.info.packageName}::${astContext.info.moduleName}::${name}`,
        fields: {
            value: {
                generics: [],
                ref: 'value',
                resource: {
                    type: 'generic',
                    name: 'T',
                },
            },
        },
        abilities: ['key', 'store'],
        generics: [{
            name: 'T',
            phantom: true,
        }],
    })
})
