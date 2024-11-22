import {MoveLexer} from "./tokens";
import {MoveParser} from './parser'
import {Context} from './context'

export {MoveLexer, MoveParser}

const source_ = `
    /// top level comment
    #[defines_primitive(vector)]
    module test::hello;
    use std::vec::Vec;
    use sui::{table::Table, table::{Self,},};
    use abc::def::{Self, Haha};
    use std::ascii::{Self, String};
    use def::bar;
    
    const EINDEX_OUT_OF_BOUNDS: u64 = 0x20000;
    
    public struct Hello<phantom any: key + store> has key, store, copy, drop {
        name: vector<u8>,
        age: u8,
        some: Vec<any>
    }
    
    public enum World<T: key + store> has key, store {
        Single,
        Struct {
            name: vector<T>,
            age: H,
            some: Vec<any>
        },
        Tuple(u64),
    }
`

const source = `public fun from_package<T>`

import { readFile } from 'fs/promises'
const file = await readFile('test.move', {
    encoding: 'utf-8'
})
const tokens = MoveLexer.tokenize(file).tokens
// console.log(tokens)
// process.exit(0)


const parser = new MoveParser(tokens)

const result = parser.parseModule()
parser.errors.length && console.log(parser.errors)
console.log(JSON.stringify(result))


