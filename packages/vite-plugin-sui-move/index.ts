import type { Plugin } from 'vite'

export interface SuiMoveOptions<Entries extends Record<string, string> | string[] | string> {
    // 指定 Move 项目的根目录, 如果传入的是一个数组，那么会自动去 move.toml 中查找名字
    entries: Entries
    overload: Entries extends Record<string, string>
        ? Partial<{ [key in keyof Entries]: string }>
        : { [key: string]: string }
}

export default function myPlugin<Entries extends string | Record<string, string> | string[]>(_: SuiMoveOptions<Entries>): Plugin {
    return {
        name: 'vite-plugin-sui-move', // 必须的，将会在 warning 和 error 中显示

    }
}

myPlugin({
    entries: {
        'sui': 'sui',
        'sui-bridge': 'sui-bridge',
    },
    overload: {
        'sui-bridge': 'sui-bridge',
        'sui': 'sui',
    },
})
