import type { IToken } from 'chevrotain'
import { MoveLexer } from './tokens'

export { MoveParser } from './parser'

export function tokenizeMove(source: string, strict: boolean = false): IToken[] {
    const rst = MoveLexer.tokenize(source)

    if (rst.errors.length) {
        consola.warn('move-ast: tokenize error')
        consola.error(rst.errors)

        if (strict) {
            throw new Error('move-ast: tokenize error, abort on strict mode')
        }
    }

    return rst.tokens
}
