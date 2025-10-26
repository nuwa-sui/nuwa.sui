export type PrimitiveMoveType = 'u8' | 'u16' | 'u32' | 'u64' | 'u128' | 'u256' | 'bool' | 'string' | 'address'
export type VectorPrimitiveType = `vector<${PrimitiveMoveType}>`

export type NonPureParamType = 'object' | 'receiving-object' | 'enum'
export type VectorContextParamType = `vector<${NonPureParamType}>`

export * from './LiteralTypes'