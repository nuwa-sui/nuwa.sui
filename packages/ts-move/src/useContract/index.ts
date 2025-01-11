import type { Transaction } from '@mysten/sui/transactions'
/*
* 定义一个 package，代表一个 move 包，包含
* - 信息
* - resources
* - functions
* */
import type { SuiAddress } from '@nuwa.sui/types/LiteralTypes.ts'
import type {
    ABIFunctions,
    ABIResources,
    MapMoveFunToTs,
    MapMoveResToBcsType,
    MoveABI,
} from '@nuwa.sui/types/MoveABITypes'

interface PackageInfo {
    name: string
    deployedAt: SuiAddress
}

class Contract<ABI extends MoveABI, Functions extends ABIFunctions = ABI['functions'], Resources extends ABIResources = ABI['resources']> {
    #ABI: ABI
    readonly package: PackageInfo

    // readonly constants: object

    get name(): string {
        return this.#ABI.moduleName
    }

    get res(): {
        [resName in keyof Resources]: MapMoveResToBcsType<Resources[resName]>
    } {
        return null as any
    }

    constructor(opts: {
        packageInfo: PackageInfo
        abi: ABI
    }) {
        this.#ABI = opts.abi
        this.package = opts.packageInfo
    }

    // @TODO: vector map
    public useFun(tx: Transaction): {
        [funName in keyof Functions]: MapMoveFunToTs<Functions, funName>
    } {
        return {} as any
    }
}

interface ABI extends MoveABI {
    packageName: 'myPackage'
    moduleName: 'myModule'
    test: false
    resources: {
        Abc: {
            type: 'struct'
            unique: false
            public: false
            target: 'Abc'
            generics: []
            abilities: []
            fields: {
                a: {
                    ref: 'value'
                    resource: {
                        type: 'primitive'
                        target: 'u8'
                    }
                    generics: []
                }
            }
        }
        Def: {
            type: 'enum'
            public: true
            abilities: []
            generics: []
            target: 'Def'
            fields: {
                A: {
                    type: 'single'
                }
                B: {
                    type: 'tuple'
                    fields: [{
                        ref: 'value'
                        generics: []
                        resource: {
                            type: 'primitive'
                            target: 'u8'
                        }
                    }, {
                        ref: 'value'
                        generics: []
                        resource: {
                            type: 'primitive'
                            target: 'bool'
                        }
                    }]
                }
                C: {
                    type: 'struct'
                    fields: {
                        n: {
                            ref: 'value'
                            resource: {
                                type: 'primitive'
                                target: 'u8'
                            }
                            generics: []
                        }
                    }
                }
            }
        }
    }
    functions: {
        mint: {
            params: {
                to: {
                    ref: 'value'
                    generics: []
                    resource: {
                        type: 'primitive'
                        target: 'address'
                    }
                }
                ctx: {
                    ref: 'mut_borrow'
                    generics: []
                    resource: {
                        type: 'imported'
                        target: 'sui::tx_context::TxContext'
                    }
                }
            }
            target: ''
            generics: [{
                name: 'T'
                abilities: []
                phantom: false
            }]
            modifiers: []
            returns: []
        }
        burn: {
            target: ''
            generics: []
            modifiers: []
            returns: []
            params: {
                obj: {
                    ref: 'value'
                    generics: []
                    resource: {
                        type: 'struct'
                        target: 'Obj'
                        unique: true
                        public: true
                        generics: []
                        abilities: []
                        fields: {
                            a: {
                                ref: 'value'
                                resource: {
                                    type: 'primitive'
                                    target: 'u8'
                                }
                                generics: []
                            }
                        }
                    }
                }
            }
        }
    }
}

const abi: ABI = {
    packageName: 'myPackage',
    moduleName: 'myModule',
    test: false,
    resources: {
        Abc: {
            type: 'struct',
            unique: false,
            public: false,
            target: 'Abc',
            generics: [],
            abilities: [],
            fields: {
                a: {
                    ref: 'value',
                    resource: {
                        type: 'primitive',
                        target: 'u8',
                    },
                    generics: [],
                },
            },
        },
        Def: {
            type: 'enum',
            public: true,
            abilities: [],
            generics: [],
            target: 'Def',
            fields: {
                A: {
                    type: 'single',
                },
                B: {
                    type: 'tuple',
                    fields: [{
                        ref: 'value',
                        generics: [],
                        resource: {
                            type: 'primitive',
                            target: 'u8',
                        },
                    }, {
                        ref: 'value',
                        generics: [],
                        resource: {
                            type: 'primitive',
                            target: 'bool',
                        },
                    }],
                },
                C: {
                    type: 'struct',
                    fields: {
                        n: {
                            ref: 'value',
                            resource: {
                                type: 'primitive',
                                target: 'u8',
                            },
                            generics: [],
                        },
                    },
                },
            },
        },
    },
    functions: {
        mint: {
            params: {
                to: {
                    ref: 'value',
                    generics: [],
                    resource: {
                        type: 'primitive',
                        target: 'address',
                    },
                },
                ctx: {
                    ref: 'mut_borrow',
                    generics: [],
                    resource: {
                        type: 'imported',
                        target: 'sui::tx_context::TxContext',
                    },
                },
            },
            target: '',
            generics: [{
                name: 'T',
                abilities: [],
                phantom: false,
            }],
            modifiers: [],
            returns: [],
        },
        burn: {
            target: '',
            generics: [],
            modifiers: [],
            returns: [],
            params: {
                obj: {
                    ref: 'value',
                    generics: [],
                    resource: {
                        type: 'struct',
                        target: 'Obj',
                        unique: true,
                        public: true,
                        generics: [],
                        abilities: [],
                        fields: {
                            a: {
                                ref: 'value',
                                resource: {
                                    type: 'primitive',
                                    target: 'u8',
                                },
                                generics: [],
                            },
                        },
                    },
                },
            },
        },
    },
}

const contract = new Contract({
    packageInfo: {} as any,
    abi,
})

const tx = {} as Transaction
contract.useFun(tx).mint({

})

contract.res.Def.fromBase64()
// const [a1, b2] = contract.res.Def.parse().B!

export function useContract(): void {

}
