import { MoveParser2024 } from '@'
import { Context } from '@/context'
import { beforeAll, beforeEach } from 'vitest'

beforeAll(() => {
    consola.wrapAll()
})

beforeEach((ctx) => {
    ctx.parser = new MoveParser2024()
    ctx.astContext = new Context({
        name: 'test',
        environment: 'module',
        moduleName: 'testModule',
        packageName: 'testPackage',
    })
})

declare module 'vitest' {
    export interface TestContext {
        parser: MoveParser2024
        astContext: Context
    }
}
