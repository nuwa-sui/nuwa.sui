import {EmbeddedActionsParser, type IToken, EOF} from 'chevrotain'
import {
    allTokens as tokens,
    As,
    Use,
    Identifier,
    DoubleColon,
    Semicolon,
    OpenCurly,
    CloseCurly,
    Comma,
    Module,
    LessThan,
    GreaterThan,
    Copy,
    Drop,
    Key,
    Plus,
    Store,
    MoveAbilities,
    Comment,
    Colon,
    Literal,
    And,
    Mut,
    Struct,
    Public,
    Has,
    Phantom,
    Enum,
    OpenParen,
    CloseParen, Entry, Fun, FunctionModifiers, Let, Const, Equal, Others
} from "./tokens"
import {Context} from './context'
import type {
    AsAlias,
    MoveBorrowType,
    MoveGenericType,
    MoveAbilitiesType,
    MoveResourceRefType,
    MoveResourceType,
    ParsedModule, MoveStructFieldsType, MoveFunctionType, MoveFunctionModifiers
} from './types'

export class MoveParser extends EmbeddedActionsParser {
    constructor(input: IToken[]) {
        super(tokens)
        this.performSelfAnalysis()
        this.input = input
    }
    
    parseModule = this.RULE('parseModule', () => {
        // module package::module {}?;
        // module package::module; ...
        let parsedModule: ParsedModule = {
            functions: {},
            resources: {}
        }
        
        this.CONSUME(Module)
        const packageName = this.CONSUME(Identifier).image
        this.CONSUME(DoubleColon)
        const moduleName = this.CONSUME1(Identifier).image
        
        const context = new Context({
            packageName,
            moduleName
        })
        
        this.OR([{
            GATE: () => this.LA(1).tokenType === OpenCurly,
            ALT: () => {
                this.CONSUME(OpenCurly)
                parsedModule = this.SUBRULE(this.parseModuleBody, {ARGS: [context]})
                this.CONSUME(CloseCurly)
                this.OPTION(() => {
                    this.CONSUME1(Semicolon)
                })
            }
        }, {
            GATE: () => this.LA(1).tokenType === Semicolon,
            ALT: () => {
                this.CONSUME(Semicolon)
                parsedModule = this.SUBRULE1(this.parseModuleBody, {ARGS: [context]})
            }
        }])
        
        return parsedModule
    })
    
    // 检查是否有指向 unknown 的资源引用，尝试在 builtInResources 中查找
    private fixResourceReference(parsed: ParsedModule, context: Context) {
        // 1. 遍历 resources 下所有 item 中的 fields 中 item 的 ref
        // 2. 遍历 functions 下所有 item 中的 params 和 returns
        function fix(resource: MoveResourceType) {
            if (resource.type === 'struct') {
                resource.fields
            }
        }
        
        
        for (let key in parsed.resources) {
            const resource = parsed.resources[key]
            if (resource.type === 'struct') {
                for (let fieldName in resource.fields) {
                    const field = resource.fields[fieldName]
                    
                    
                }
            } else if (resource.type === 'enum') {
            
            }
        }
        
    }
    
    parseModuleBody = this.RULE('parseModuleBody', (context: Context): ParsedModule => {
        // uses
        // consts
        // resources
        // functions
        !context && (context = new Context())
        
        const parsedModule: ParsedModule = {
            resources: {},
            functions: {}
        }
        
        this.MANY(() => {
            this.OR([
                {
                    GATE: () => this.LA(1).tokenType === Use || this.LA(2).tokenType === Use,
                    ALT: () => {
                        this.SUBRULE(this.parseUse, {ARGS: [context]})
                        !this.RECORDING_PHASE && console.log('parseUse')
                    }
                }, {
                    ALT: () => {
                        this.SUBRULE(this.parseStruct, {ARGS: [context]})
                        !this.RECORDING_PHASE && console.log('parseStruct')
                    }
                }, {
                    ALT: () => {
                        this.SUBRULE(this.parseEnum, {ARGS: [context]})
                        !this.RECORDING_PHASE && console.log('parseEnum')
                    }
                }, {
                    ALT: () => {
                        this.SUBRULE(this.parseVarDeclaration)
                        !this.RECORDING_PHASE && console.log('parseVarDeclaration')
                    }
                }, {
                    ALT: () => {
                        const function_ = this.SUBRULE(this.parseFunction, {ARGS: [context]})
                        if (function_) {
                            parsedModule.functions[function_.name] = function_
                        }
                        !this.RECORDING_PHASE && console.log('parseFunction')
                    }
                }
            ])
        })
        
        !this.RECORDING_PHASE && (parsedModule.resources = context.builtInResources)
        
        return parsedModule
    })
    
    // 解析变量声明 let, const，目前跳过，不解析
    parseVarDeclaration = this.RULE('parseVarDeclaration', (context: Context) => {
        !context && (context = new Context())
        // let a: u8 = 1;
        // let mut b: u8 = 2;
        // let c = 3;
        
        this.OR([{
            ALT: () => {
                this.CONSUME(Let)
            }
        }, {
            ALT: () => {
                this.CONSUME(Const)
            }
        }])
        
        // value, skipped now.
        // drop all tokens until semicolon
        if (!this.RECORDING_PHASE) {
            while (this.LA(1).tokenType !== Semicolon) {
                this.SKIP_TOKEN()
            }
        }
        
        
        this.CONSUME(Semicolon)
    })
    
    // 解析元组，可以用于解析 fun-args, fun-return, etc.
    parseTuple = this.RULE('parseTuple', (context: Context): MoveResourceRefType[] => {
        !context && (context = new Context())
        
        const result: MoveResourceRefType[] = []
        
        this.OPTION({
            GATE: () => this.LA(1).tokenType === OpenParen,
            DEF: () => {
                this.CONSUME(OpenParen)
                
                this.MANY(() => {
                    result.push(this.SUBRULE(this.parseFieldRef, {ARGS: [context]}))
                    this.OPTION1(() => {
                        this.CONSUME(Comma)
                    })
                })
                
                this.CONSUME(CloseParen)
            }
        })
        
        return result
    })
    
    // 解析泛型，在 struct, enum, function 中声明泛型时使用
    parseGeneric = this.RULE('parseGeneric', (context: Context): MoveGenericType[] => {
        // <T, U>, <T: store + copy + drop + key>
        !context && (context = new Context())
        const result: MoveGenericType[] = []
        
        this.OPTION({
            GATE: () => this.LA(1).tokenType === LessThan,
            DEF: () => {
                this.CONSUME(LessThan)
                this.MANY(() => {
                    let phantom = false
                    this.OPTION1(() => {
                        this.CONSUME(Phantom)
                        phantom = true
                    })
                    
                    const generic: MoveGenericType = {
                        name: this.CONSUME(Identifier).image,
                        abilities: [],
                        phantom
                    }
                    
                    // ability
                    this.OPTION2({
                        GATE: () => this.LA(1).tokenType === Colon,
                        DEF: () => {
                            this.CONSUME(Colon)
                            this.AT_LEAST_ONE_SEP1({
                                SEP: Plus,
                                DEF: () => {
                                    generic.abilities.push(this.CONSUME(MoveAbilities).image as any)
                                }
                            })
                        }
                    })
                    
                    this.OPTION3(() => {
                        this.CONSUME(Comma)
                    })
                    
                    result.push(generic)
                })
                this.CONSUME(GreaterThan)
            }
        })
        
        for (let generic of result) {
            context.registerResource(generic.name, {
                type: 'generic',
                name: generic.name,
                abilities: generic.abilities
            })
        }
        return result
    })
    
    // 解析资源的泛型，在 struct-field 或者 enum-field, fun-args, 变量声明中 中使用
    parseFieldGenerics = this.RULE('parseFieldGenerics', (context: Context): MoveResourceRefType [] => {
        // <Abc<Def, Ghj>>
        !context && (context = new Context())
        
        const result: MoveResourceRefType[] = []
        
        this.OPTION({
            GATE: () => this.LA(1).tokenType === LessThan,
            DEF: () => {
                this.CONSUME(LessThan)
                this.AT_LEAST_ONE_SEP({
                    SEP: Comma,
                    DEF: () => {
                        const genericName = this.CONSUME(Literal).image
                        result.push({
                            ref: 'value',
                            resource: context.resolveResources(genericName),
                            generics: this.SUBRULE(this.parseFieldGenerics, {
                                ARGS: [context]
                            })
                        })
                    }
                })
                this.CONSUME(GreaterThan)
            }
        })
        
        return result
    })
    
    // 解析引用的资源，在 struct-field 或者 enum-field, fun-args，变量声明中使用
    parseFieldRef = this.RULE('parseFieldRef', (context: Context): MoveResourceRefType => {
        // &TxContext, &mut Abc, u8, vector<u8>
        // Abc<Def, Asc<Table>>
        // sui::SUI
        // sui::sui::SUI
        
        !context && (context = new Context())
        let ref: MoveBorrowType = 'value'
        let target: MoveResourceType
        
        this.OPTION(() => {
            this.OR([{
                GATE: () => this.LA(2).tokenType !== Mut,
                ALT: () => {
                    this.CONSUME(And)
                    ref = 'borrow'
                }
            }, {
                ALT: () => {
                    this.CONSUME1(And)
                    this.CONSUME(Mut)
                    ref = 'mut_borrow'
                }
            }])
        })
        
        // some
        // module::some
        // pkg::module::some
        let targetRepr = ''
        
        this.MANY(() => {
            targetRepr += this.CONSUME(Literal).image
            
            this.OPTION1(() => {
                this.CONSUME(DoubleColon)
                targetRepr += '::'
            })
        })
        
        target = context.resolveResources(targetRepr)
        
        return {
            ref,
            resource: target,
            generics: this.SUBRULE(this.parseFieldGenerics, {
                ARGS: [context]
            })
        }
    })
    
    // 用于解析 struct 和 enum 的 ability
    parseAbility = this.RULE('parseAbility', () => {
        // key, store, copy, drop
        const result: MoveAbilitiesType[] = []
        
        this.OPTION({
            GATE: () => this.LA(1).tokenType === Has,
            DEF: () => {
                this.CONSUME(Has)
                this.AT_LEAST_ONE_SEP({
                    SEP: Comma,
                    DEF: () => {
                        result.push(this.CONSUME(MoveAbilities).image as any)
                    }
                })
            }
        })
        
        return result
    })
    
    parseStructFields = this.RULE('parseStructFields', (context: Context): MoveStructFieldsType => {
        // name: u8, age: u8, some: Vec<u8>
        // name: u8, age: u8, some: Vec<u8>
        // name: u8, age: u8, some: Vec<u8>,
        const fields: MoveStructFieldsType = {}
        
        // 使用 MANY_SEP，如果末尾有有 SEP，会导致 unmatched
        this.MANY({
            // GATE: () => this.LA(1).tokenType !== CloseCurly,
            DEF: () => {
                const fieldName = this.CONSUME(Literal).image
                this.CONSUME(Colon)
                fields[fieldName] = this.SUBRULE(this.parseFieldRef, {ARGS: [context]})
                this.OPTION(() => {
                    this.CONSUME(Comma)
                })
            }
        })
        
        return fields
    })
    
    parseStruct = this.RULE('parseStruct', (context: Context) => {
        !context && (context = new Context())
        
        let isPublic = false
        this.OPTION(() => {
            this.CONSUME(Public)
            isPublic = true
        })
        
        this.CONSUME(Struct)
        
        const structName = this.CONSUME(Identifier).image
        const struct: MoveResourceType = {
            type: 'struct',
            public: isPublic,
            target: `${context.info.packageName}::${context.info.moduleName}::${structName}`,
            generics: [],
            fields: {},
            abilities: []
        }
        
        const newContext = context.fork('struct', structName)
        
        struct.generics = this.SUBRULE(this.parseGeneric, {ARGS: [newContext]})
        
        // 注入泛型到新的 context 中
        if (!this.RECORDING_PHASE) {
            for (let generic of struct.generics) {
                newContext.registerResource(generic.name, {
                    type: 'generic',
                    name: generic.name,
                    abilities: generic.abilities
                })
            }
        }
        
        
        struct.abilities = this.SUBRULE(this.parseAbility)
        this.CONSUME(OpenCurly)
        // parseFields
        
        struct.fields = this.SUBRULE(this.parseStructFields, {ARGS: [newContext]})
        
        this.CONSUME(CloseCurly)
        
        context.registerBuiltInResource(structName, struct)
        return struct
    })
    
    parseEnum = this.RULE('parseEnum', (context: Context): MoveResourceType => {
        /*
        * public enum DEF {
        *   Tuple(u64, u64),
        *   Struct{
        *       a: u64,
        *       b: u64,
        *   },
        *   Single
        * }
        **/
        !context && (context = new Context())
        
        let isPublic = false
        this.OPTION(() => {
            this.CONSUME(Public)
            isPublic = true
        })
        
        this.CONSUME(Enum)
        
        const enumName = this.CONSUME(Literal).image
        const newContext = context.fork('enum', enumName)
        
        
        const generics = this.SUBRULE(this.parseGeneric, {ARGS: [newContext]})
        const abilities = this.SUBRULE(this.parseAbility,)
        
        const enum_: MoveResourceType = {
            type: 'enum',
            public: isPublic,
            target: `${context.info.packageName}::${context.info.moduleName}::${enumName}`,
            abilities,
            generics,
            fields: {}
        }
        
        this.CONSUME(OpenCurly)
        // parse fields
        this.MANY({
            GATE: () => this.LA(1).tokenType !== CloseCurly,
            DEF: () => {
                const fieldName = this.CONSUME1(Literal).image
                const nextToken = this.LA(1).tokenType
                
                this.OR([
                    {
                        GATE: () => nextToken === OpenCurly,
                        ALT: () => {
                            // struct
                            this.CONSUME1(OpenCurly)
                            enum_.fields[fieldName] = {
                                type: 'struct',
                                fields: this.SUBRULE(this.parseStructFields, {ARGS: [newContext]})
                            }
                            this.CONSUME(CloseCurly)
                        }
                    }, {
                        GATE: () => nextToken === OpenParen,
                        ALT: () => {
                            // tuple
                            enum_.fields[fieldName] = {
                                type: 'tuple',
                                fields: this.SUBRULE(this.parseTuple, {ARGS: [newContext]})
                            }
                        }
                    }, {
                        GATE: () => nextToken === Comma,
                        ALT: () => {
                            // single
                            enum_.fields[fieldName] = {
                                type: 'single'
                            }
                        }
                    }
                ])
                
                
                // 末尾逗号，容错
                this.OPTION1(() => {
                    this.CONSUME(Comma)
                })
            }
        })
        
        this.CONSUME1(CloseCurly)
        
        !this.RECORDING_PHASE && context.registerBuiltInResource(enumName, enum_)
        return enum_
    })
    
    parseFunctionArgs = this.RULE('parseFunctionArgs', (context: Context): MoveStructFieldsType => {
        this.CONSUME(OpenParen)
        const fields = this.SUBRULE(this.parseStructFields, {ARGS: [context]})
        this.CONSUME(CloseParen)
        return fields
    })
    
    dropCodeBlock() {
        if (!this.RECORDING_PHASE) {
            let leftCloseCurly = 0
            do {
                const next = this.LA(1).tokenType
                if (next === OpenCurly) {
                    // new block
                    leftCloseCurly++
                } else if (this.LA(1).tokenType === CloseCurly) {
                    // end block
                    leftCloseCurly--
                }
                // console.log('drop: ', this.LA(1).image)
                this.SKIP_TOKEN()
            } while (leftCloseCurly !== 0)
        }
    }
    
    // 解析函数，在遇到 macro-fun 时，返回 null
    parseFunction = this.RULE('parseFunction', (context: Context): MoveFunctionType | null => {
        !context && (context = new Context())
        const modifiers: MoveFunctionModifiers[] = []
        
        
        // 函数修饰符，native, public, entry, macro
        this.MANY(() => {
            modifiers.push(this.CONSUME(FunctionModifiers).image as MoveFunctionModifiers)
        })
        
        this.CONSUME(Fun)
        
        const functionName = this.CONSUME(Literal).image
        
        const newContext = context.fork('code-block', functionName)
        
        if (!this.RECORDING_PHASE && modifiers.includes('macro')) {
            // macro-fun, drop until code block start
            while (this.LA(1).tokenType !== OpenCurly) {
                this.SKIP_TOKEN()
            }
            this.dropCodeBlock()
            return null
        }
        
        const generics = this.SUBRULE(this.parseGeneric, {ARGS: [newContext]})
        
        const params = this.SUBRULE(this.parseFunctionArgs, {ARGS: [newContext]})
        
        // 返回值
        let returns: MoveResourceRefType[] = []
        this.OPTION({
            GATE: () => this.LA(1).tokenType === Colon,
            DEF: () => {
                this.CONSUME(Colon)
                this.OR([{
                    GATE: () => this.LA(1).tokenType === OpenParen,
                    ALT: () => {
                        // tuple return
                        returns = this.SUBRULE(this.parseTuple, {ARGS: [newContext]})
                    }
                }, {
                    ALT: () => {
                        // single return
                        returns = [this.SUBRULE(this.parseFieldRef, {ARGS: [newContext]})]
                    }
                }])
            }
        })
        
        // drop code block
        if (!this.RECORDING_PHASE && !modifiers.includes('native')) {
            this.dropCodeBlock()
        } else {
            // native function
            this.CONSUME(Semicolon)
        }
        
        return {
            name: functionName,
            modifiers,
            generics,
            params,
            returns
        }
    })
    
    parseAsIfExists = this.RULE('parseAsIfExists', (): AsAlias => {
        // identifier as alias
        const original = this.CONSUME(Literal).image
        if (this.LA(1).tokenType === As) {
            this.CONSUME(As)
            return {
                original,
                alias: this.CONSUME1(Literal).image
            }
        }
        return {
            original,
            alias: undefined
        }
    })
    
    parseUseField = this.RULE(
        'parseUseField',
        (registerResource: ReturnType<Context["resourceImporter"]>) => {
            if (!registerResource) {
                registerResource = () => {
                }
            }
            
            this.OR([{
                ALT: () => {
                    // 单个 resources
                    const matched = this.SUBRULE(this.parseAsIfExists)
                    registerResource(matched)
                }
            }, {
                ALT: () => {
                    // 多个 resources
                    this.CONSUME(OpenCurly)
                    this.MANY(() => {
                        this.OPTION(() => {
                            const matched = this.SUBRULE1(this.parseAsIfExists)
                            registerResource(matched)
                            this.OPTION1(() => {
                                this.CONSUME(Comma)
                            })
                        })
                    })
                    this.CONSUME(CloseCurly)
                }
            }])
        })
    
    parseImport = this.RULE('parseImport', (context: Context) => {
        // package::module;
        // package::module::{function1, function2};
        // package::{module1, module2};
        // package::{module1::{function1, function2}, module2};
        
        // package::module as alias;
        // package::module::{function1, function2 as alias};
        // package::{module1, module2 as alias};
        // package::{module1::{function1, function2 as alias}, module2};
        
        !context && (context = new Context())
        
        const packageName = this.CONSUME(Literal).image
        
        this.CONSUME(DoubleColon)
        
        this.OR([
            {
                // single module import
                GATE: this.BACKTRACK(this.parseAsIfExists),
                ALT: () => {
                    let matched = this.SUBRULE(this.parseAsIfExists)
                    if (matched.alias) {
                        // `module as alias`, stop to import sub resources
                        context.registerResource(matched.alias, {
                            type: 'imported',
                            target: `${packageName}::${matched.original}`
                        })
                        return
                    }
                    
                    const moduleName = matched.original
                    // non-alias
                    
                    // module only
                    if (this.LA(1).tokenType === Semicolon) {
                        
                        context.registerResource(matched.original, {
                            type: 'imported-module',
                            target: `${packageName}::${moduleName}`
                        })
                        return
                    }
                    
                    
                    // ::{function1, function2}
                    // ::function
                    this.CONSUME1(DoubleColon)
                    if (this.LA(1).tokenType === OpenCurly) {
                        // multiple resources
                        // {function1, function2}
                        this.CONSUME(OpenCurly)
                        this.MANY(() => {
                            const matched = this.SUBRULE1(this.parseAsIfExists)
                            context.registerResource(matched.alias ?? matched.original, {
                                type: 'imported',
                                target: `${packageName}::${moduleName}::${matched.original}`
                            })
                            
                            if (this.LA(1).tokenType === Comma) {
                                this.SKIP_TOKEN()
                            }
                        })
                        this.CONSUME(CloseCurly)
                        return;
                    }
                    
                    // single resource
                    matched = this.SUBRULE2(this.parseAsIfExists)
                    context.registerResource(matched.alias ?? matched.original, {
                        type: 'imported',
                        target: `${packageName}::${moduleName}::${matched.original}`
                    })
                    
                }
            }, {
                // multiple module import
                GATE: () => this.LA(1).tokenType === OpenCurly,
                ALT: () => {
                    this.CONSUME(OpenCurly)
                    this.MANY(() => {
                        const matched = this.SUBRULE3(this.parseAsIfExists)
                        if (matched.alias) {
                            // module as alias,
                            context.registerResource(matched.alias, {
                                type: 'imported-module',
                                target: `${packageName}::${matched.original}`
                            })
                            
                            if (this.LA(1).tokenType === Comma) {
                                this.SKIP_TOKEN()
                            }
                            
                            return
                        }
                        
                        const moduleName = matched.original
                        
                        
                        // `module,` only module import.
                        if (this.LA(1).tokenType !== DoubleColon) {
                            context.registerResource(matched.original, {
                                type: 'imported-module',
                                target: `${packageName}::${moduleName}`
                            })
                            
                            if (this.LA(1).tokenType === Comma) {
                                this.SKIP_TOKEN()
                            }
                            return
                        }
                        
                        // module::{function1, function2},
                        this.CONSUME(DoubleColon)
                        
                        if (this.LA(1).tokenType !== OpenCurly) {
                            // single resource
                            const matched = this.SUBRULE4(this.parseAsIfExists)
                            
                            context.registerResource(matched.alias ?? matched.original, {
                                type: 'imported',
                                target: `${packageName}::${moduleName}::${matched.original}`
                            })
                            
                            if (this.LA(1).tokenType === Comma) {
                                this.SKIP_TOKEN()
                            }
                            
                            return
                        }
                        
                        this.CONSUME(OpenCurly)
                        this.MANY(() => {
                            const matched = this.SUBRULE5(this.parseAsIfExists)
                            
                            if (matched.original === 'Self') {
                                // register as module
                                context.registerResource(matched.alias ?? moduleName, {
                                    type: 'imported-module',
                                    target: `${packageName}::${moduleName}`
                                })
                            } else {
                                context.registerResource(matched.alias ?? matched.original, {
                                    type: 'imported',
                                    target: `${packageName}::${moduleName}::${matched.original}`
                                })
                            }
                            
                            
                            if (this.LA(1).tokenType === Comma) {
                                this.SKIP_TOKEN()
                            }
                        })
                        
                        
                        this.CONSUME(CloseCurly)
                        
                        if (this.LA(1).tokenType === Comma) {
                            this.SKIP_TOKEN()
                        }
                    })
                    this.CONSUME(CloseCurly)
                }
            }
        ])
    })
    
    parseUse = this.RULE('parseUse', (context: Context) => {
        // use
        // use package::module::function;
        // use package::module::{function1, function2};
        // use package::{module1, module2};
        // use package::{module1::{function1, function2}, module2};
        
        // use package::module as alias;
        // use package::module::function as alias;
        // use package::module::{function1, function2 as alias};
        // use package::{module1, module2 as alias};
        // use package::{module1::{function1, function2 as alias}, module2};
        
        // use fun cup_borrow as Cup.borrow;
        // public use fun cup_borrow as Cup.borrow;
        
        
        !context && (context = new Context())
        
        this.OPTION(() => {
            this.CONSUME(Public)
        })
        
        this.CONSUME(Use)
        
        if (this.LA(1).tokenType === Fun) {
            // use all functions, drop
            while (this.LA(1).tokenType !== Semicolon) {
                this.SKIP_TOKEN()
            }
        } else {
            this.SUBRULE(this.parseImport, {ARGS: [context]})
        }
        
        this.CONSUME(Semicolon)
        return context
    })
    
    parseUse_ = this.RULE('parseUse_', (context: Context) => {
        // use package::module;
        // use package::module as alias;
        // use package::module::function;
        // use package::module::function as alias;
        // use package::module::{function1, function2};
        // use package::module::{function1, function2 as alias};
        // use package::{module1::{function1}, module2::function2, module3};
        !context && (context = new Context())
        
        this.CONSUME(Use)
        
        // package
        const packageName = this.CONSUME(Literal).image
        this.CONSUME(DoubleColon)
        
        this.OR([{
            ALT: () => {
                // 单个 module 导入
                // use pkg::module::???;
                const moduleName = this.CONSUME1(Literal).image
                this.CONSUME1(DoubleColon)
                const registerResource = context.resourceImporter({
                    moduleName,
                    packageName
                })
                this.SUBRULE(this.parseUseField, {
                    ARGS: [registerResource]
                })
            }
        }, {
            ALT: () => {
                // 多个 module
                // use sui::{ table::Table, table::{Self, Table,},};
                this.CONSUME(OpenCurly)
                this.MANY(() => {
                    // module
                    const moduleName = this.CONSUME2(Literal).image
                    
                    if (this.LA(1).tokenType !== DoubleColon) {
                        // module only
                        context.registerResource(moduleName, {
                            type: 'imported-module',
                            target: `${packageName}::${moduleName}`
                        })
                        
                        this.OPTION1(() => {
                            this.CONSUME(Comma)
                        })
                        
                        return
                    }
                    
                    this.CONSUME2(DoubleColon)
                    
                    const registerResource = context.resourceImporter({
                        moduleName,
                        packageName
                    })
                    
                    this.SUBRULE1(this.parseUseField, {
                        ARGS: [registerResource]
                    })
                    
                    this.OPTION2(() => {
                        this.CONSUME(Comma)
                    })
                })
                this.CONSUME(CloseCurly)
            }
        }, {
            ALT: () => {
                // use sui::coin;
                const matched = this.SUBRULE2(this.parseAsIfExists)
                context.registerResource(matched.alias ?? matched.original, {
                    type: 'imported-module',
                    target: `${packageName}::${matched.original}`,
                })
            }
        }])
        
        
        this.CONSUME(Semicolon)
    })
    
}