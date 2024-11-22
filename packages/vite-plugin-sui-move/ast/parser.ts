import {EmbeddedActionsParser, type IToken} from 'chevrotain'
import {
    allTokens as tokens,
    And,
    As,
    Bang,
    CloseCurly,
    CloseParen,
    Colon,
    Comma,
    Const,
    DoubleColon,
    Enum,
    Equal,
    Fun,
    FunctionModifiers,
    GreaterThan,
    Has,
    LeftBracket,
    LessThan,
    Let,
    Literal, LiteralString,
    Module,
    MoveAbilities,
    Mut,
    OpenCurly,
    OpenParen,
    Phantom,
    Plus,
    Public,
    RightBracket,
    Semicolon,
    Sharp,
    Struct,
    Use, PublicWithParam,
} from "./tokens"
import {Context} from './context'
import type {
    AsAlias,
    MoveAbilitiesType,
    MoveAttributeType,
    MoveBorrowType,
    MoveFunctionModifiers,
    MoveFunctionType,
    MoveGenericType,
    MoveResourceRefType,
    MoveResourceType,
    MoveStructFieldsType,
    ParsedModule
} from './types'

export class MoveParser extends EmbeddedActionsParser {
    constructor(input: IToken[]) {
        super(tokens)
        this.performSelfAnalysis()
        this.input = input
    }
    
    
    // 检查是否有指向 unknown 的资源引用，尝试在 builtInResources 中查找
    static fixResourceReference(parsed: ParsedModule, context: Context) {
        // 1. 遍历 resources 下所有 item 中的 fields 中 item 的 ref
        // 2. 遍历 functions 下所有 item 中的 params 和 returns
        function fix(resource: MoveResourceType, rePlace: (_: MoveResourceType) => void) {
            if (resource.type === 'unknown') {
                rePlace(context.resolveResources(resource.target))
            }
            
            if (resource.type === 'struct') {
                Object.values(resource.fields).forEach((field) => {
                    fix(field.resource, (newResource) => {
                        field.resource = newResource
                    })
                })
                
                // fix generics
                Object.values(resource.fields).forEach((fields) => {
                    Object.values(resource.fields).forEach((field) => {
                        field.generics.values().forEach((generic) => {
                            fix(generic.resource, (newResource) => {
                                generic.resource = newResource
                            })
                        })
                    })
                })
            }
            
            if (resource.type === 'enum') {
                Object.values(resource.fields).forEach((field) => {
                    if (field.type === 'struct') {
                        Object.entries(field.fields).forEach(([fieldName, field]) => {
                            fix(field.resource, (newResource) => {
                                field.resource = newResource
                            })
                        })
                        Object.values(field.fields).forEach((field) => {
                            field.generics.forEach((generic) => {
                                fix(generic.resource, (newResource) => {
                                    generic.resource = newResource
                                })
                            })
                        })
                        
                    } else if (field.type === 'tuple') {
                        field.fields.forEach((field) => {
                            fix(field.resource, (newResource) => {
                                field.resource = newResource
                            })
                            
                            // fix generics
                            field.generics.values().forEach((generic) => {
                                fix(generic.resource, (newResource) => {
                                    generic.resource = newResource
                                })
                            })
                        })
                    }
                })
            }
        }
        
        // 先修复 context
        Object.entries(context.resources).forEach(([name, resource]) => {
            // context 顶层应该不存在 unknown，这里主要让他去递归修复
            fix(resource, (_) => {})
        })
        
        // 修复 resource 中的引用
        Object.entries(parsed.resources).forEach(([name, resource]) => {
            // 同理，这里应该不存在 unknown
            fix(resource, (newResource) => {})
        })
        
        // 修复 function 中的引用
        Object.values(parsed.functions).forEach((func) => {
            // 参数
            Object.values(func.params).forEach((param) => {
                fix(param.resource, (newResource) => {
                    param.resource = newResource
                })
            })
            
            // 返回值
            for (const rst of func.returns) {
                fix(rst.resource, (newResource) => {
                    rst.resource = newResource
                })
            }
        })
        
    }
    
    // 如果 attributes 中包含 test_only 或者 test，则返回一个新的 context，不会影响原有 context
    private newContextIfTestOnly(context: Context): [Context, MoveAttributeType] {
        const attributes = context.consumeAttributes()
        
        if ('test_only' in attributes || 'test' in attributes) {
            // test only
            return [new Context(), attributes]
        }
        
        return [context, attributes]
    }
    
    // 解析模块, 返回 ParsedModule
    parseModule = this.RULE('parseModule', (): ParsedModule => {
        // module package::module {}?;
        // module package::module; ...
        
        const parsedModule: ParsedModule = {
            packageName: 'Unknown',
            moduleName: 'Unknown',
            test: false,
            resources: {},
            functions: {}
        }
        
        
        this.MANY(() => {
            const tempContext = new Context()
            this.SUBRULE(this.parseMoveAttribute, {ARGS: [tempContext]})
            
            const attributes = tempContext.consumeAttributes()
            
            if ('test_only' in attributes || 'test' in attributes) {
                // test module，skip
                parsedModule.test = true
            }
        })
        
        this.CONSUME(Module)
        const packageName = this.CONSUME(Literal).image
        parsedModule.packageName = packageName
        this.CONSUME(DoubleColon)
        const moduleName = this.CONSUME1(Literal).image
        parsedModule.moduleName = moduleName
        
        
        let context = new Context({
            packageName,
            moduleName
        })
        
        this.OR([{
            GATE: () => this.LA(1).tokenType === OpenCurly,
            ALT: () => {
                this.CONSUME(OpenCurly)
                this.SUBRULE(this.parseModuleBody, {ARGS: [context]})
                this.CONSUME(CloseCurly)
                this.OPTION(() => {
                    this.CONSUME1(Semicolon)
                })
            }
        }, {
            GATE: () => this.LA(1).tokenType === Semicolon,
            ALT: () => {
                this.CONSUME(Semicolon)
                this.SUBRULE1(this.parseModuleBody, {ARGS: [context]})
            }
        }])
        
        // this.fixResourceReference()
        parsedModule.resources = context.builtInResources
        parsedModule.functions = context.functions
        
        MoveParser.fixResourceReference(parsedModule, context)
        return parsedModule
    })
    
    parseModuleBody = this.RULE('parseModuleBody', (context_: Context) => {
        // uses
        // consts
        // resources
        // functions
        !context_ && (context_ = new Context())
        
        this.MANY(() => {
            this.OR([
                {
                    GATE: () => this.LA(1).tokenType === Use || this.LA(2).tokenType === Use,
                    ALT: () => {
                        context_.consumeAttributes()
                        this.SUBRULE(this.parseUse, {ARGS: [context_]})
                        !this.RECORDING_PHASE && console.log('parseUse')
                    }
                }, {
                    ALT: () => {
                        let [context, attributes] = this.newContextIfTestOnly(context_)
                        const rst = this.SUBRULE(this.parseStruct, {ARGS: [context]})
                        
                        this.ACTION(() => {
                            const [name, struct] = rst
                            if (
                                attributes.ext
                                && typeof attributes.ext === 'object'
                                && 'unique_object' in attributes.ext
                                && struct.type === 'struct'
                            ) {
                                struct.unique = true
                            }
                            context.registerBuiltInResource(name, struct)
                            !this.RECORDING_PHASE && console.log('parseStruct', name)
                        })
                    }
                }, {
                    ALT: () => {
                        let [context] = this.newContextIfTestOnly(context_)
                        const rst = this.SUBRULE(this.parseEnum, {ARGS: [context]})
                        
                        this.ACTION(() => {
                            const [name, enum_] = rst
                            context.registerBuiltInResource(name, enum_)
                            
                            !this.RECORDING_PHASE && console.log('parseEnum', name)
                        })
                    }
                }, {
                    ALT: () => {
                        context_.consumeAttributes()
                        this.SUBRULE(this.parseVarDeclaration)
                        
                        !this.RECORDING_PHASE && console.log('parseVarDeclaration')
                    }
                }, {
                    ALT: () => {
                        const [context] = this.newContextIfTestOnly(context_)
                        
                        const rst = this.SUBRULE(this.parseFunction, {ARGS: [context]})
                        
                        this.ACTION(() => {
                            if (rst) {
                                const [name, function_] = rst
                                context.registerFunction(name, function_)
                                !this.RECORDING_PHASE && console.log('parseFunction', name)
                            }
                        })
                    }
                }, {
                    GATE: () => this.LA(1).tokenType === Sharp,
                    ALT: () => {
                        this.SUBRULE(this.parseMoveAttribute, {ARGS: [context_]})
                        !this.RECORDING_PHASE && console.log('parseMoveAttribute')
                    }
                }
            ])
        })
    })
    
    // 解析变量声明 let, const，目前跳过，不解析
    parseVarDeclaration = this.RULE('parseVarDeclaration', () => {
        
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
                    const rst = this.SUBRULE(this.parseFieldRef, {ARGS: [context]})
                    rst && result.push(rst)
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
                        name: this.CONSUME(Literal).image,
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
    parseFieldRef = this.RULE('parseFieldRef', (context: Context): MoveResourceRefType | null => {
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
        if (!targetRepr.length) {
            return null
        }
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
                this.OPTION(() => {
                    this.CONSUME(Mut)
                })
                const fieldName = this.CONSUME(Literal).image
                this.CONSUME(Colon)
                const rst = this.SUBRULE(this.parseFieldRef, {ARGS: [context]})
                rst && (fields[fieldName] = rst)
                this.OPTION1(() => {
                    this.CONSUME(Comma)
                })
            }
        })
        
        return fields
    })
    
    parseStruct = this.RULE('parseStruct', (context: Context): [string, MoveResourceType] => {
        !context && (context = new Context())
        
        let isPublic = false
        this.OPTION(() => {
            this.CONSUME(PublicWithParam)
            isPublic = true
        })
        
        this.CONSUME(Struct)
        
        const structName = this.CONSUME(Literal).image
        const struct: MoveResourceType = {
            type: 'struct',
            unique: false,
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
        
        let isEmptyStruct = false
        this.OPTION1(() => {
            // empty struct
            this.CONSUME(OpenParen)
            let idx = 0
            this.MANY(() => {
                const rst = this.SUBRULE(this.parseFieldRef, {ARGS: [newContext]})
                if (rst) {
                    struct.fields[idx.toString()] = rst
                    idx++
                }
            })
            this.CONSUME(CloseParen)
            isEmptyStruct = true
        })
        
        
        struct.abilities = this.SUBRULE(this.parseAbility)
        
        if (!isEmptyStruct) {
            this.CONSUME(OpenCurly)
            // parseFields
            
            struct.fields = this.SUBRULE(this.parseStructFields, {ARGS: [newContext]})
            
            this.CONSUME(CloseCurly)
        } else {
            this.CONSUME(Semicolon)
        }
        
        
        // context.registerBuiltInResource(structName, struct)
        return [structName, struct]
    })
    
    parseEnum = this.RULE('parseEnum', (context: Context): [string, MoveResourceType] => {
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
            this.CONSUME(PublicWithParam)
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
        
        // context.registerBuiltInResource(enumName, enum_)
        return [enumName, enum_]
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
    parseFunction = this.RULE('parseFunction', (context: Context): [string, MoveFunctionType] | null => {
        !context && (context = new Context())
        const modifiers: MoveFunctionModifiers[] = []
        
        
        // 函数修饰符，native, public, entry, macro
        this.MANY(() => {
            let modifier = this.CONSUME(FunctionModifiers).image as MoveFunctionModifiers
            modifiers.push(modifier)
            // modifiers.push(this.CONSUME(FunctionModifiers).image as MoveFunctionModifiers)
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
                        const rst = this.SUBRULE(this.parseFieldRef, {ARGS: [newContext]})
                        returns = rst ? [rst] : []
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
        
        return [functionName, {
            target: `${context.info.packageName}::${context.info.moduleName}:${functionName}`,
            modifiers,
            generics,
            params,
            returns
        }]
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
    
    
    parseMoveAttributeBody = this.RULE('parseMoveAttributeBody', (attributes?: MoveAttributeType): MoveAttributeType => {
        !(attributes) && (attributes = {})
        
        // method(sub1="some", sub2(subSub1="someSome"), sub3),?
        // `method ,?` only
        
        // abc, def, hi = "hello", jk(...)
        this.MANY(() => {
            const profile = this.CONSUME(Literal).image
            attributes[profile] = true
            
            this.OPTION({
                GATE: () => this.LA(1).tokenType === Equal || this.LA(1).tokenType === OpenParen,
                DEF: () => {
                    this.OR([
                        {
                            GATE: () => this.LA(1).tokenType === Equal,
                            ALT: () => {
                                this.CONSUME(Equal)
                                this.OR1([{
                                    ALT: () => {
                                        attributes[profile] = this.CONSUME(LiteralString).image
                                    }
                                    
                                }, {
                                    ALT: () => {
                                        attributes[profile] = this.CONSUME1(Literal).image
                                    }
                                }])
                            }
                        }, {
                            GATE: () => this.LA(1).tokenType === OpenParen,
                            ALT: () => {
                                this.CONSUME(OpenParen)
                                attributes[profile] = this.SUBRULE(this.parseMoveAttributeBody, {ARGS: [{}]})
                                this.CONSUME(CloseParen)
                            }
                            
                        }
                    ])
                }
            })
            
            
            this.OPTION1(() => {
                this.CONSUME(Comma)
            })
        })
        
        
        return attributes
    })
    
    parseMoveAttribute = this.RULE('parseMoveAttribute', (context: Context) => {
        // #[move]
        // #[move(abc)]
        // #![move(abc, def)]
        !context && (context = new Context())
        
        const attributes: MoveAttributeType = {}
        
        this.CONSUME(Sharp)
        this.OPTION(() => {
            this.CONSUME(Bang)
        })
        this.CONSUME(LeftBracket)
        
        this.OPTION1(() => {
            Object.assign(attributes, this.SUBRULE(this.parseMoveAttributeBody, {ARGS: [attributes]}))
        })
        
        this.CONSUME(RightBracket)
        
        if (Object.keys(attributes).length !== 0) {
            context.registerAttribute(attributes)
        }
        
        return attributes
    })
    
}