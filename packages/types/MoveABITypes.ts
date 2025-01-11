/*
* @author: majoson
* 此文件用于将 Move ABI 映射到 TypeScript 类型，实现极为复杂，修改需要谨慎
* */
import type { EnumInputShape, EnumOutputShape } from '@mysten/bcs'
import type { bcs, BcsType } from '@mysten/sui/bcs'
import type { TransactionResult as TransactionResult_ } from '@mysten/sui/transactions'
import type { SuiAddress } from './LiteralTypes.ts'

type BCS = typeof bcs
// fix nested result
type TransactionResult = TransactionResult_ | { $kind: 'NestedResult', NestedResult: [number, number] }

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

// export interface MoveOptionalResType extends MoveImportedResType {
//     type: 'imported'
//     target: 'std::option::Option'
// }
//
// export interface MoveStringResType extends MoveImportedResType {
//     type: 'imported'
//     target: 'std::ascii::String' | 'std::string::String'
// }

export type MoveResourceType =
    MoveImportedResType
    | MovePrimitiveResType
    | MoveStructResType
    | MoveEnumResType
    | MoveGenericResType
    | MoveVariableResType
// | MoveOptionalResType
// | MoveStringResType

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

export type MapMovePrimitiveToBcsType<Res extends MovePrimitiveResType, T = Res['target']> =
    T extends 'u8' ? BCS['U8'] :
        T extends 'u16' ? BCS['U16'] :
            T extends 'u32' ? BCS['U32'] :
                T extends 'u64' ? BCS['U64'] :
                    T extends 'u128' ? BCS['U128'] :
                        T extends 'u256' ? BCS['U256'] :
                            T extends 'bool' ? BCS['Bool'] :
                                T extends 'address' ? BCS['Address'] :
                                    never

export type MapMoveMoveStructToBcsType<Res extends MoveStructResType> = BcsType<
    {
        [key in keyof Res['fields']]: MapMoveResToBcsType<Res['fields'][key]['resource']> extends BcsType<infer U, any> ? U : never
    },
    {
        [key in keyof Res['fields']]: MapMoveResToBcsType<Res['fields'][key]['resource']> extends BcsType<any, infer U> ? U : never
    }
>

type MapMoveTupleEnumFieldsToBcsType<Fields extends MoveEnumTupleFieldType['fields'], Input extends boolean = true> = {
    [Field in keyof Fields]: Input extends true ?
            (MapMoveResToBcsType<Fields[Field]['resource']> extends BcsType<any, infer U> ? U : never) :
            (MapMoveResToBcsType<Fields[Field]['resource']> extends BcsType<infer U, any> ? U : never)
}

export type MapMoveEnumToBcsType<Res extends MoveEnumResType> = BcsType<
    EnumOutputShape<{
        [Field in keyof Res['fields']]:
        // single
        Res['fields'][Field] extends MoveEnumSingleFieldType ? true :
            // struct
            Res['fields'][Field] extends MoveEnumStructFieldType ? {
                [SubField in keyof Res['fields'][Field]['fields']]: MapMoveResToBcsType<Res['fields'][Field]['fields'][SubField]['resource']> extends BcsType<infer U, any> ? U : never
            } :
                // tuple
                Res['fields'][Field] extends MoveEnumTupleFieldType ?
                    MapMoveTupleEnumFieldsToBcsType<Res['fields'][Field]['fields'], false>
                    : never
    }>,
    EnumInputShape<{
        [Field in keyof Res['fields']]:
        // single
        Res['fields'][Field] extends MoveEnumSingleFieldType ? boolean :
            // struct
            Res['fields'][Field] extends MoveEnumStructFieldType ? {
                [SubField in keyof Res['fields'][Field]['fields']]: MapMoveResToBcsType<Res['fields'][Field]['fields'][SubField]['resource']> extends BcsType<any, infer U> ? U : never
            } :
                // tuple
                Res['fields'][Field] extends MoveEnumTupleFieldType ?
                    MapMoveTupleEnumFieldsToBcsType<Res['fields'][Field]['fields'], true>
                    : never
    }>
>

// 将 resources 映射到 BcsType
export type MapMoveResToBcsType<Res extends MoveResourceType> = Res extends MoveImportedResType ? BcsType<any, any> :
    Res extends MovePrimitiveResType ? MapMovePrimitiveToBcsType<Res> :
        Res extends MoveStructResType ? MapMoveMoveStructToBcsType<Res> :
            Res extends MoveEnumResType ? MapMoveEnumToBcsType<Res> : never

// export type MapMovePrimitiveToTsType<T extends MovePrimitiveType> = T extends 'u8' | 'u16' | 'u32' ? number | bigint | string :
//     T extends 'u64' | 'u128' | 'u256' ? bigint | string :
//         T extends 'bool' ? boolean :
//             T extends 'address' ? SuiAddress :
//                 never

type Includes<T extends readonly any[], U> = T extends [infer First, ...infer Rest]
    ? (First extends U ? true : Includes<Rest, U>)
    : false

export type MapMovePrimitiveToArgInput<Arg extends MovePrimitiveResType> = MapMovePrimitiveToBcsType<Arg> extends BcsType<infer U, any> ? U : never
export type MapMoveStructToArgInput<Ref extends MoveResourceRefType, Arg = Ref['resource']> = Arg extends MoveStructResType ?
    // unique obj, can be undefined; key object, can pass by SuiAddress
    (Arg['unique'] extends true ? undefined | SuiAddress : Includes<Arg['abilities'], 'key'> extends true ? SuiAddress : never) | TransactionResult : never
export type MapMoveImportedToArgInput<Ref extends MoveResourceRefType, Arg = Ref['resource']> = Arg extends MoveImportedResType ?
        (
        // tx_context
            Arg['target'] extends 'sui::tx_context::TxContext' | 'sui::clock::Clock' | 'sui::random::Random' ? undefined :
            // option
                Arg['target'] extends 'std::option::Option' ? undefined | TransactionResult | MapMoveFunArgToInput<Ref['generics'][0]> :
                    Arg['target'] extends 'std::vector' ? (
                    // vector
                    Ref['generics'][0]['resource'] extends MovePrimitiveResType ? (
                        Ref['generics'][0]['resource']['target'] extends 'u8' ? string | Uint8Array : MapMoveFunArgToInput<Ref['generics'][0]>[]) : MapMoveFunArgToInput<Ref['generics'][0]>[]
                    ) | TransactionResult : MapMoveFunArgToInput<Ref['generics'][0]>[]
        )
    : never

// 将单个参数映射为 moveCall 中的输入类型
export type MapMoveFunArgToInput<Ref extends MoveResourceRefType, Arg = Ref['resource']> =
    Arg extends MovePrimitiveResType ?
        MapMovePrimitiveToArgInput<Arg> :
        Arg extends MoveStructResType ?
            MapMoveStructToArgInput<Ref> :
            Arg extends MoveImportedResType ?
                MapMoveImportedToArgInput<Ref> :
                never

export type MapMoveFunToTs<Functions extends ABIFunctions, FunName extends keyof Functions> = (
    params: {
        // required params
        [paramName in keyof Functions[FunName]['params'] as Functions[FunName]['params'][paramName]['resource'] extends MoveImportedResType ? (
            Functions[FunName]['params'][paramName]['resource']['target'] extends 'std::option::Option' | 'sui::tx_context::TxContext' ? never : paramName
        ) : Functions[FunName]['params'][paramName]['resource'] extends MoveStructResType ? (
            Functions[FunName]['params'][paramName]['resource']['unique'] extends true ? never : paramName
        ) : paramName]: MapMoveFunArgToInput<Functions[FunName]['params'][paramName]>
    } & {
        // optional params, unique-obj, tx_context, option
        [paramName in keyof Functions[FunName]['params'] as Functions[FunName]['params'][paramName]['resource'] extends MoveImportedResType ? (
            Functions[FunName]['params'][paramName]['resource']['target'] extends 'std::option::Option' | 'sui::tx_context::TxContext' ? paramName : never
        ) : Functions[FunName]['params'][paramName]['resource'] extends MoveStructResType ? (
            Functions[FunName]['params'][paramName]['resource']['unique'] extends true ? paramName : never
        ) : never]+?: MapMoveFunArgToInput<Functions[FunName]['params'][paramName]> | undefined
    }
) => TransactionResult_
