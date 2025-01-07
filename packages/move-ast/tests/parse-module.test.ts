import type { Storage } from 'unstorage'
import { MoveParser2024, tokenizeMove } from '@'
import { createStorage } from 'unstorage'
import githubDriver from 'unstorage/drivers/github'
import { expect } from 'vitest'

it('should module be parsed', ({ parser }) => {
    parser.input = tokenizeMove(
        `
        // some comments
        
        module TestPackage::TestModule {
        
            #[attr]
            public struct TestResource {
                value: u8
            }
        }
        `,
    )
    expect(parser.parseModule()).toMatchObject({})

    parser.input = tokenizeMove(
        `
        module test::Abc;
        
        #[attr]
        public struct TestResource {
            value: u8
        }
        `,
    )
    expect(parser.parseModule()).toMatchObject({})
})

it('should fix error reference', ({ parser }) => {
    parser.input = tokenizeMove(
        `
        module TestPackage::TestModule;
        
        
        public fun abc(arg: TestA): TestB {
        }
        
        public struct TestB {
            value: TestA
        }
        
        public struct TestA {
            value: SUI
        }
        
        use sui::sui::SUI;
        `,
    )

    const module = parser.parseModule()

    expect(module).toMatchSnapshot()
})

const storageSuiFramework = createStorage({
    driver: githubDriver({
        repo: 'MystenLabs/sui',
        dir: 'crates/sui-framework/packages/move-stdlib/sources',
        branch: 'testnet',
    }),
})

const storageSuiStdlib = createStorage({
    driver: githubDriver({
        repo: 'MystenLabs/sui',
        dir: 'crates/sui-framework/packages/sui-framework/sources',
        branch: 'testnet',
    }),
})

async function toStorageKeyPair(storage: Storage<string>, name: string): Promise<[Storage<string>, string, string][]> {
    const rst: [Storage<string>, string, string][] = []
    for (const key of await storage.keys()) {
        rst.push([storage, key, name])
    }
    return rst
}

it.concurrent.each<[Storage<string>, string, string]>([
    ...(await toStorageKeyPair(storageSuiFramework, 'sui-framework')),
    ...(await toStorageKeyPair(storageSuiStdlib, 'sui-stdlib')),
])('should parse std-lib success', async (storage, key, name) => {
    consola.info('fetch: ', name, ' - ', key)
    const sourceCode = (await storage.get(key)) as string
    const parser = new MoveParser2024(tokenizeMove(sourceCode))
    const module = parser.parseModule()
    expect(module).toMatchObject({})
    expect(parser.errors.length, JSON.stringify(parser.errors)).toBe(0)
    consola.success('parse success: ', name, ' - ', key)
})
