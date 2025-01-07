import type { EnumInputShape, EnumOutputShape } from '@mysten/bcs'
import type { bcs, BcsType } from '@mysten/sui/bcs'
import type { TransactionResult } from '@mysten/sui/transactions'
import type { SuiAddress, SuiIdentifier } from './LiteralTypes.ts'

type BCS = typeof bcs

export type MoveAbilitiesType = 'key' | 'store' | 'copy' | 'drop'

export type MoveBorrowType = 'value' | 'borrow' | 'mut_borrow'

export interface MoveGenericType {
    name: string
    abilities: MoveAbilitiesType[]
    phantom: boolean
}

export interface MoveResourceRefType {
    ref: MoveBorrowType
    resource: MoveResourceType
    generics: MoveResourceRefType[]
}

export interface MovePrimitiveResType {
    type: 'primitive'
    target: MovePrimitiveType
}

export interface MoveStructResType {
    type: 'struct'
    unique: boolean
    public: boolean
    target: string
    generics: MoveGenericType[]
    abilities: MoveAbilitiesType[]
    fields: MoveStructFieldsType
}

export interface MoveEnumResType {
    type: 'enum'
    public?: boolean
    target: string
    generics: MoveGenericType[]
    abilities: MoveAbilitiesType[]
    fields: {
        [key: string]: MoveEnumFieldType
    }
}

export interface MoveGenericResType {
    type: 'generic'
    name: string
    abilities: MoveAbilitiesType[]
}

export interface MoveVariableResType {
    type: 'variable'
    name: string
    isConstant: boolean
    borrowType: MoveBorrowType
    typing: MoveResourceRefType
}

export interface MoveImportedResType {
    type: 'imported' | 'imported-module' | 'unknown'
    target: string // u8, std::vec::Vec, T, etc.
}

export interface MoveOptionalResType {
    type: 'imported'
    target: 'std::option::Option'
}

export interface MoveStringResType {
    type: 'imported'
    target: 'std::ascii::String' | 'std::string::String'
}

export type MoveResourceType =
    MoveImportedResType
    | MovePrimitiveResType
    | MoveStructResType
    | MoveEnumResType
    | MoveGenericResType
    | MoveVariableResType
    | MoveOptionalResType
    | MoveStringResType

export interface MoveStructFieldsType {
    [key: string]: MoveResourceRefType
}

export interface MoveEnumSingleFieldType {
    type: 'single'
}

export interface MoveEnumStructFieldType {
    type: 'struct'
    fields: {
        [key: string]: MoveResourceRefType
    }
}

export interface MoveEnumTupleFieldType {
    type: 'tuple'
    fields: MoveResourceRefType[]
}

export type MoveEnumFieldType = MoveEnumSingleFieldType | MoveEnumStructFieldType | MoveEnumTupleFieldType

export type MoveFunctionModifiers = 'native' | 'public' | 'entry' | 'macro' | 'public(friend)'

export interface MoveFunctionType {
    target: string
    modifiers: MoveFunctionModifiers[]
    generics: MoveGenericType[]
    params: {
        [key: string]: MoveResourceRefType
    }
    returns: MoveResourceRefType[]
}

export type ABIFunctions = Record<string, MoveFunctionType>
export type ABIResources = Record<string, MoveStructResType | MoveEnumResType>

export interface MoveABI {
    packageName: string
    moduleName: string
    test: boolean

    resources: ABIResources
    functions: ABIFunctions
}

export type MovePrimitiveType = `u${8 | 16 | 32 | 64 | 128 | 256}` | 'bool' | 'address'

export type MapMovePrimitiveToBcsType<T extends MovePrimitiveType> =
    T extends 'u8' ? BCS['U8'] :
        T extends 'u16' ? BCS['U16'] :
            T extends 'u32' ? BCS['U32'] :
                T extends 'u64' ? BCS['U64'] :
                    T extends 'u128' ? BCS['U128'] :
                        T extends 'u256' ? BCS['U256'] :
                            T extends 'bool' ? BCS['Bool'] :
                                T extends 'address' ? BCS['Address'] :
                                    never

export type MapMoveResToBcsType<Res extends MoveResourceType> = Res extends MoveImportedResType ? BcsType<any, any> :
    Res extends MovePrimitiveResType ? MapMovePrimitiveToBcsType<Res['target']> :
        Res extends MoveStructResType ?
            // struct
            BcsType<{
                [key in keyof Res['fields']]: MapMoveResToBcsType<Res['fields'][key]['resource']> extends BcsType<infer U, any> ? U : never
            }, {
                    [key in keyof Res['fields']]: MapMoveResToBcsType<Res['fields'][key]['resource']> extends BcsType<any, infer U> ? U : never
                }> :
            Res extends MoveEnumResType ?
                // enum
                // @TODO: 好像少了一层 BcsType
                BcsType<
                    EnumOutputShape<{
                        [Field in keyof Res['fields']]:
                        // single
                        Res['fields'][Field] extends MoveEnumSingleFieldType ? true :
                            // struct
                            Res['fields'][Field] extends MoveEnumStructFieldType ? {
                                [SubField in keyof Res['fields'][Field]['fields']]: MapMoveResToBcsType<Res['fields'][Field]['fields'][SubField]['resource']> extends BcsType<infer U, any> ? U : never
                            }
                                // tuple
                                : Res['fields'][Field] extends MoveEnumTupleFieldType ?
                                        {
                                            -readonly [index in keyof Res['fields'][Field]['fields'] as index extends number ? index : never]: index extends number ? MapMoveResToBcsType<Res['fields'][Field]['fields'][index]['resource']> extends BcsType<infer U, any> ? U : never : never
                                        }
                                    : never
                    }>,
                    EnumInputShape<{
                        [Field in keyof Res['fields']]:
                        // single
                        Res['fields'][Field] extends MoveEnumSingleFieldType ? true :
                            // struct
                            Res['fields'][Field] extends MoveEnumStructFieldType ? {
                                [SubField in keyof Res['fields'][Field]['fields']]: MapMoveResToBcsType<Res['fields'][Field]['fields'][SubField]['resource']> extends BcsType<any, infer U> ? U : never
                            }
                                // tuple
                                : Res['fields'][Field] extends MoveEnumTupleFieldType ?
                                        {
                                            [index in keyof Res['fields'][Field]['fields'] as index extends number ? index : never]: index extends number ? MapMoveResToBcsType<Res['fields'][Field]['fields'][index]['resource']> extends BcsType<any, infer U> ? U : never : never
                                        }
                                    : never
                    }>
                >
                : never

export type MapMovePrimitiveToTsType<T extends MovePrimitiveType> = T extends 'u8' | 'u16' | 'u32' ? number | bigint | string :
    T extends 'u64' | 'u128' | 'u256' ? bigint | string :
        T extends 'bool' ? boolean :
            T extends 'address' ? SuiAddress :
                never

type Includes<T extends readonly any[], U> = T extends [infer First, ...infer Rest]
    ? (First extends U ? true : Includes<Rest, U>)
    : false

export type MapMoveFunToTs<Functions extends ABIFunctions, funName extends keyof Functions> = (params: {
    [paramName in keyof Functions[funName]['params'] as Functions[funName]['params'][paramName]['resource'] extends MoveOptionalResType ? never : paramName]: MapMoveFunArgToTs<Functions[funName]['params'][paramName]['resource']>
} & {
    [paramName in keyof Functions[funName]['params'] as Functions[funName]['params'][paramName]['resource'] extends MoveOptionalResType ? paramName : never]+?: MapMoveFunArgToTs<Functions[funName]['params'][paramName]['resource']>
} & {
    [genericIndex in keyof Functions[funName]['generics'] as genericIndex extends number ? `$${Functions[funName]['generics'][genericIndex]['name']}` : never]: SuiIdentifier
}) => TransactionResult

export type MapMoveFunArgToTs<Arg extends MoveResourceType> =
    Arg extends MovePrimitiveResType ?
        MapMovePrimitiveToTsType<Arg['target']> | TransactionResult
        : Arg extends MoveStructResType ?
            Includes<Arg['abilities'], 'key'> extends true ? SuiAddress | TransactionResult
                : TransactionResult
            : Arg extends MoveOptionalResType ?
                undefined | string | TransactionResult
                : Arg extends MoveStringResType ? string | TransactionResult
                    : TransactionResult

// export type MapMoveFunToTs<Functions extends ABIFunctions, funName extends keyof Functions> = (params: {
//     [paramName in keyof Functions[funName]['params']]: (
//         Functions[funName]['params'][paramName]['resource'] extends MovePrimitiveResType ?
//                 MapMovePrimitiveToTsType<Functions[funName]['params'][paramName]['resource']['target']> | TransactionResult
//             : Functions[funName]['params'][paramName]['resource'] extends MoveStructResType ?
//                 Includes<Functions[funName]['params'][paramName]['resource']['abilities'], 'key'> extends true ? SuiAddress | TransactionResult : TransactionResult : TransactionResult
//     )
// }) => TransactionResult
