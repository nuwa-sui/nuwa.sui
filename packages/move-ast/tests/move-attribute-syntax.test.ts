import { tokenizeMove } from '@'

it('should normal move-attr be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove(`#[a, b = "hello", ext(unique_object, some_else = "abc")]`)
    parser.parseMoveAttribute(astContext)
    expect(astContext.consumeAttributes()).toMatchObject({
        a: true,
        b: 'hello',
        ext: {
            unique_object: true,
            some_else: 'abc',
        },
    })
})
