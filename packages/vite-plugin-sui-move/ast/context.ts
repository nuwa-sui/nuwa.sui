import type {AsAlias, ContextEnvironment, MoveResourceType} from './types.ts'

const PrimitiveTypes = ['u8', 'u16', 'u32', 'u64', 'u128', 'u256', 'bool', 'address', 'vector']

/*
* 用于记录上下文，用于 module，code-block，struct，enum 等环境
* */
export class Context {
    readonly upper: Context | null
    readonly resources: {
        [key: string]: MoveResourceType
    }
    readonly builtInResources: {
        [key: string]: MoveResourceType
    }
    
    readonly environment: ContextEnvironment
    readonly info: {
        packageName: string,
        moduleName: string,
        // somePackage::SomeModule::SomeFunc::CodeBlock0
        repr: string
    }
    
    constructor(opts?: {
        packageName?: string,
        moduleName?: string,
        environment?: ContextEnvironment
        name?: string,
        resources?: {
            [key: string]: MoveResourceType
        },
        upper?: Context
    }) {
        opts = opts ?? {}
        
        this.info = {} as any
        this.environment = opts.environment ?? 'module'
        
        if (opts.upper) {
            this.upper = opts.upper
            this.info.moduleName = opts.upper.info.packageName
            this.info.packageName = opts.upper.info.packageName
            this.resources = JSON.parse(JSON.stringify(this.upper.resources))
            this.builtInResources = this.upper.builtInResources
        } else {
            // root-level context
            this.upper = null
            this.info.packageName = opts.packageName ?? 'UnknownPackage'
            this.info.moduleName = opts.moduleName ?? 'UnknownModule'
            this.resources = opts.resources ?? {}
            this.builtInResources = {}
            
            // built-in resources
            // for (let name of PrimitiveTypes) {
            //     this.resources[name] = {
            //         type: 'primitive',
            //         target: name
            //     }
            // }
        }
        
        
        if (this.environment === 'module') {
            this.info.repr = `${this.info.packageName}::${this.info.moduleName}`
        } else {
            this.info.repr = `${this.upper!.info.repr}::${opts.name}`
        }
    }
    
    public registerResource(name: string, resource: MoveResourceType) {
        this.resources[name] = resource
    }
    
    // 注册模块内的资源，例如定义的 struct，enum, 会同时注册到 resources 和 builtInResources 中
    public registerBuiltInResource(name: string, resource: MoveResourceType) {
        this.builtInResources[name] = resource
        this.resources[name] = resource
        
        // ⚠️ 向上传导
        // 由于 builtInResources 是浅拷贝，所以不需要向上传导
        // if (this.upper) {
        //     this.upper.registerBuiltInResource(name, resource)
        // }
    }
    
    public resourceImporter(opts: {
        packageName: string,
        moduleName: string,
    }) {
        const {packageName, moduleName} = opts
        return (target: AsAlias | string) => {
            if (typeof target === 'string') {
                if (target === 'Self') {
                    this.registerResource(target, {
                        type: 'imported-module',
                        target: `${packageName}::${moduleName}`,
                    })
                    return;
                }
                
                this.registerResource(target, {
                    type: 'imported',
                    target: `${packageName}::${moduleName}::${target}`,
                })
                return;
            } else if ('original' in target) {
                if (target.original === 'Self') {
                    this.registerResource(target.alias ?? moduleName, {
                        type: 'imported-module',
                        target: `${packageName}::${moduleName}`,
                    })
                    return;
                }
                this.registerResource(target.alias ?? target.original, {
                    type: 'imported',
                    target: `${packageName}::${moduleName}::${target.original}`,
                })
            }
        }
    }
    
    // 传入资源标识符，返回资源的类型，如果 global 内没有找到，则认为是未知类型
    public resolveResources(name: string): MoveResourceType {
        
        // module::resource 的形式
        if (name.includes('::')) {
            const matches = name.split('::')
            if (matches.length === 3) {
                // with package
                return {
                    type: 'imported',
                    target: name
                }
            }
            
            const [moduleName, resourceName] = matches
            if (this.resources[moduleName]) {
                if (this.resources[moduleName].type === 'imported-module') {
                    return {
                        type: 'imported',
                        target: `${this.resources[moduleName].target}::${resourceName}`
                    }
                }
            }
        }
        
        // 直接 resource 的形式，在全局变量中查找
        if (this.resources[name]) {
            return this.resources[name]
        }
        
        return {
            type: 'unknown',
            target: `${name}`
        }
        
    }
    
    // 复制一个新的 Context，拥有相同的资源
    public fork(environment: ContextEnvironment, name: string) {
        return new Context({
            environment: this.environment,
            upper: this,
            name,
        })
    }
}