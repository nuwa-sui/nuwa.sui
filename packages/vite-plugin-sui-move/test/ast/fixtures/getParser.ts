import { MoveParser } from '@ast/parser'
import { MoveLexer } from '@ast/tokens.ts'

export function getParser(source: string): MoveParser {
    const lexer = MoveLexer.tokenize(source)
    return new MoveParser(lexer.tokens)
}
