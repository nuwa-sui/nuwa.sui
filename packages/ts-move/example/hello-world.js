/* eslint-disable */
// @ts-expect-error dev-ing.
import {hello_world} from '$move::my_package'
// @ts-expect-error dev-ing.
import {usePackageInfo, TsMove} from '@nuwa.sui/ts-move'

// 在插件中，通过配置项开启是否自动生成一个全局的 tsMove 对象
// import { tsMove } from '$move'

// ！！！ API 的设计需要优先考虑到 tree-shaking ！！！n

// ======  vite.config.ts ======

defineConfig({
    plugins: [
        tsMovePlugin({
            // 是否生成 '$move' 模块
            global: {
                // 传入在 new TsMove 时的配置
            },
            // 指定包的路径, 路径下需要有 Move.toml 文件
            packages: {
                my_package: {
                    local: path.reslove(__dirname, 'src/my_package'),
                },
                other_package: {
                    github: {
                        url: '',
                        subdir: '',
                        rev: 'main',
                    }
                },
            },
            overrideABI: {
                my_package: {
                    // ...
                }
            }
        })
    ]
})

// =============================


const tsMove = new TsMove({
    packages: {
        my_package: '0x123',
        other_package: '0x456',
    },
    uniqueObjects: {
        'hello_package::hello_world::Some': '0x789',
    }
})

// hello_world.Some: BcsType
hello_world.Some.fromBase64()

const query = tsMove.useQuery({
    target: hello_world.Some,
    id_optional: "0x123",
    options: {
        useCache: {
            ttl: 1000,
            max_items: 10000,
        }
    },
})

// 刷新缓存，下次调用时会重新获取数据
query.flush()

// for obj-only, return content
await query.content()

// 没有在合约 attr 中指定 keyType 和 valueType 的情况下，需要手动指定
const dynamic = query.dynamic(keyType, valueType, {
    useCache: {} // 同上，如果在这里没有指定，会使用 query 的配置
})
await dynamic.get()
await dynamic.exists()

// @TODO: 嵌套的结构如何处理？ 例如 Some.a 是一个 Table，Some.b 是一个 Map

// return type: Transaction
tsMove.useTx(tx_optional, ({my_package, other_package}, tx_optional) => {
    my_package.mint({
        // ...
    })
})

console.log(usePackageInfo('my_package').package_id)
