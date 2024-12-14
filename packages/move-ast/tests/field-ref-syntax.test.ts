import { tokenizeMove } from '@'
import { expect } from 'vitest'

it('should normal field-ref be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove('u8')
    const rst = parser.parseFieldRef(astContext)
    expect(rst).toMatchObject({
        generics: [],
        ref: 'value',
        resource: astContext.resolveResources('u8'),
    })
})

it('should mut-ref field-ref be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove('&mut u8')
    const rst = parser.parseFieldRef(astContext)
    expect(rst).toMatchObject({
        generics: [],
        ref: 'mut_borrow',
        resource: astContext.resolveResources('u8'),
    })
})

it('should ref field-ref be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove('&u8')
    const rst = parser.parseFieldRef(astContext)
    expect(rst).toMatchObject({
        ref: 'borrow',
        resource: astContext.resolveResources('u8'),
    })
})

it('should full-path resource can be resolve', ({ parser, astContext }) => {
    parser.input = tokenizeMove('&mut sui::sui::SUI')
    const rst = parser.parseFieldRef(astContext)
    expect(rst).toMatchObject({
        ref: 'mut_borrow',
        resource: {
            type: 'imported',
            target: 'sui::sui::SUI',
        },
    })
})

it('should vector can be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove('&mut vector<u8>')
    const rst = parser.parseFieldRef(astContext)
    expect(rst).toMatchObject({
        ref: 'mut_borrow',
        resource: astContext.resolveResources('vector'),
        generics: [{
            ref: 'value',
            resource: astContext.resolveResources('u8'),
        }],
    })
})
