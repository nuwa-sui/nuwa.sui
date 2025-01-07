import type { IToken } from 'chevrotain'
import { MoveLexer } from './tokens'

export { MoveParser2024 } from './parser2024'

export type { MoveABI } from './types'

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
