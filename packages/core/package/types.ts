import type { TransactionObjectInput, TransactionResult } from '@mysten/sui/transactions'

export type PrimitiveMoveType = 'u8' | 'u16' | 'u32' | 'u64' | 'u128' | 'u256' | 'bool' | 'string' | 'address'
export type VectorPrimitiveType = `vector<${PrimitiveMoveType}>`

export type NonPureParamType = 'object' | 'receiving-object' | 'enum'
export type VectorContextParamType = `vector<${NonPureParamType}>`

// 不需要用户填写的参数，例如某些全局唯一的 object，给一个 callback
export type AutoParamType = 'auto'
export type TypeParamType = 'type'
export type ParamType =
    PrimitiveMoveType
    | VectorPrimitiveType
    | NonPureParamType
    | VectorContextParamType
    | AutoParamType
    | TypeParamType

// 将 Move 的参数类型映射为 TypeScript 的类型
export type MoveParamToTsType<T extends ParamType> =
    T extends 'fixed'
        ? never
        : T extends 'u8' | 'u16' | 'u32' // 无符号整数类型映射
            ? number | bigint
            : T extends 'u64' | 'u128' | 'u256'
                ? bigint
                : T extends 'bool' // 布尔类型映射
                    ? boolean
                    // 字符串
                    : T extends 'string' // 字符串类型映射
                        ? string | Uint8Array
                        // 泛型
                        : T extends 'type' ? `${string}::${string}:${string}`
                            // 地址
                            : T extends 'address'
                                ? `0x${string}` // 地址映射为字符串
                                // 数组
                                : T extends `vector<${infer InnerType}>`
                                    ? InnerType extends ParamType
                                        ? MoveParamToTsType<InnerType>[]
                                        : never
                                    // 对象和 enum
                                    : T extends 'object' | 'receiving-object'
                                        ? TransactionObjectInput | string
                                        : T extends 'enum'
                                            ? never
                                            : never

export type ContractFunctions = Record<string, {
    name: string
    native: boolean
    entry: boolean
    public: boolean
    params: Record<string, ParamType>
}>

export type ContractResource = Record<string, {
    name: string
    type: 'struct' | 'enum'
    ability: ('key' | 'store' | 'copy' | 'drop')[]
    definition: Record<string, string | PrimitiveMoveType | VectorPrimitiveType>
}>

export interface MoveModuleABI {
    package: string
    name: string
    functions: ContractFunctions
    structs: ContractResource
    dependencies?: Record<string, MoveModuleABI>
}

export type MovePackageABI<Modules extends string[]> = {
    package: string
    name: string

} & {
    [module in Modules[number]]: MoveModuleABI
}

export type MovePackage<Modules extends string[], ABI extends MovePackageABI<Modules>> = {
    [module_ in keyof ABI]: {
        // 具有调用合约函数的能力
        functions: {
            [K in keyof ABI[module_]['functions']]: (
                params: {
                    [P in keyof ABI[module_]['functions'][K]['params'] as ABI[module_]['functions'][K]['params'][P] extends 'auto' ? never : P]:
                    ABI[module_]['functions'][K]['entry'] extends true
                        // entry 不允许传入 TransactionResult
                        ? MoveParamToTsType<ABI[module_]['functions'][K]['params'][P]>
                        : MoveParamToTsType<ABI[module_]['functions'][K]['params'][P]> | TransactionResult
                }
            ) => TransactionResult
        }
        objects: {
            [key: string]: any
        }
    }
}
