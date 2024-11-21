export type AsAlias = {
    original: string,
    alias: string | undefined
}

export type ContextEnvironment = 'package' | 'module' | 'code-block' | 'struct' | 'enum'

export type MoveAbilitiesType = 'key' | 'store' | 'copy' | 'drop'

export type MoveBorrowType = 'value' | 'borrow' | 'mut_borrow'

export type MoveGenericType = {
    name: string,
    abilities: MoveAbilitiesType[],
    phantom: boolean
}

export type MoveResourceRefType = {
    ref: MoveBorrowType,
    resource: MoveResourceType,
    generics: MoveResourceRefType[]
}

export type MoveResourceType = {
    type: 'primitive' | 'imported' | 'imported-module' | 'unknown',
    target: string // u8, std::vec::Vec, T, etc.
} | {
    type: 'struct'
    public: boolean
    target: string
    generics: MoveGenericType[]
    abilities: MoveAbilitiesType[]
    fields: MoveStructFieldsType
} | {
    type: 'enum'
    public: boolean
    target: string
    generics: MoveGenericType[]
    abilities: MoveAbilitiesType[]
    fields: {
        [key: string]: MoveEnumFieldType
    }
} | {
    type: 'generic'
    name: string,
    abilities: MoveAbilitiesType[]
} | {
    type: 'variable',
    name: string,
    isConstant: boolean,
    borrowType?: MoveBorrowType
    typing?: MoveResourceRefType
}

export type MoveStructFieldsType = {
    [key: string]: MoveResourceRefType
}

export type MoveEnumFieldType = {
    type: 'single'
} | {
    type: 'struct'
    fields: {
        [key: string]: MoveResourceRefType
    }
} | {
    type: 'tuple',
    fields: MoveResourceRefType[]
}

export type MoveFunctionModifiers = 'native' | 'public' | 'entry' | 'macro'

export type MoveFunctionType = {
    name: string,
    modifiers: MoveFunctionModifiers[],
    generics: MoveGenericType[],
    params: {
        [key: string]: MoveResourceRefType
    },
    returns: MoveResourceRefType[]
}

export type ParsedModule = {
    // imported: {
    //     [key: string]: MoveResourceType
    // },
    // built-in resources
    resources: {
        [key: string]: MoveResourceType
    },
    functions: {
        [key: string]: MoveFunctionType
    }
}