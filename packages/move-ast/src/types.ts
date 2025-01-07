export interface AsAlias {
    original: string
    alias: string | undefined
}

export type ContextEnvironment = 'package' | 'module' | 'code-block' | 'struct' | 'enum'

export interface MoveAttributeType {
    [key: string]: true | string | MoveAttributeType
}

export type {
    MoveABI,
    MoveAbilitiesType,
    MoveBorrowType,
    MoveEnumFieldType,
    MoveFunctionModifiers,
    MoveFunctionType,
    MoveGenericType,
    MoveResourceRefType,
    MoveResourceType,
    MoveStructFieldsType,
} from '@nuwa.sui/types/MoveABITypes'
