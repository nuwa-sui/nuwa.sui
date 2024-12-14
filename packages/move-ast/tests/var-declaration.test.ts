import { tokenizeMove } from '@'

it('should var declaration be parsed', ({ parser }) => {
    parser.input = tokenizeMove(`const a: u8 = 1;`)
    expect(parser.parseVarDeclaration()).toBeNull()
})
