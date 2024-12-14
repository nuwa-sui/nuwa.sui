import { tokenizeMove } from '@'
import { checkResource } from './utils.ts'

it('should signal use be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove('use 0x2::sui::SUI;')
    parser.parseUse(astContext)
    checkResource(astContext, 'SUI', { type: 'imported', target: '0x2::sui::SUI' })

    parser.input = tokenizeMove('use sui::sui::SUI')
    parser.parseUse(astContext)
    checkResource(astContext, 'SUI', { type: 'imported', target: 'sui::sui::SUI' })
})

it ('should signal use with alias be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove('use 0x2::sui::SUI as ABC;')
    parser.parseUse(astContext)
    checkResource(astContext, 'ABC', { type: 'imported', target: '0x2::sui::SUI' })

    parser.input = tokenizeMove('use sui::sui::Self as ABC')
    parser.parseUse(astContext)
    checkResource(astContext, 'ABC', { type: 'imported-module', target: 'sui::sui' })
})

it('should use module be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove('use sui::sui;')
    parser.parseUse(astContext)
    checkResource(astContext, 'sui', { type: 'imported-module', target: 'sui::sui' })

    parser.input = tokenizeMove('use sui::sui as sub;')
    parser.parseUse(astContext)
    checkResource(astContext, 'sub', { type: 'imported-module', target: 'sui::sui' })
})

it('should multiple item import be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove(
        `use 0x2::sui::{
                Self,
                SUI,
                mint,
                burn,
            };`,
    )
    parser.parseUse(astContext)
    checkResource(astContext, 'sui', { type: 'imported-module', target: '0x2::sui' })
    checkResource(astContext, 'SUI', { type: 'imported', target: '0x2::sui::SUI' })
    checkResource(astContext, 'mint', { type: 'imported', target: '0x2::sui::mint' })
    checkResource(astContext, 'burn', { type: 'imported', target: '0x2::sui::burn' })
})

it('should multiple module import be parsed', ({ parser, astContext }) => {
    parser.input = tokenizeMove(`
            use sui::{
                table::Table,
                vec::{Self, Vec, push_back},
                sui::Self,
                suii::Self as subb,
            };
        `)
    parser.parseUse(astContext)

    checkResource(astContext, 'Table', { type: 'imported', target: 'sui::table::Table' })
    checkResource(astContext, 'vec', { type: 'imported-module', target: 'sui::vec' })
    checkResource(astContext, 'Vec', { type: 'imported', target: 'sui::vec::Vec' })
    checkResource(astContext, 'push_back', { type: 'imported', target: 'sui::vec::push_back' })
    checkResource(astContext, 'sui', { type: 'imported-module', target: 'sui::sui' })
    checkResource(astContext, 'subb', { type: 'imported-module', target: 'sui::suii' })
})

it('should use function alias not abort', ({ parser, astContext }) => {
    parser.input = tokenizeMove('public use fun sui::pay::divide_and_keep as Coin.divide_and_keep;')
    parser.parseUse(astContext)
})
