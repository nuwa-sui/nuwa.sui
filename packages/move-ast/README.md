# move-ast

这个项目用于 `sui-move` 的 `ast` 分析，旨在生成一个可以供 TS 识别的 `abi`

## 注意事项

当前适配 `sui-move-2024` 语法版本，而且处于实验中，欢迎反馈意见。


## 安装
```shell
pnpm add @nuwa.sui/move-ast
```

## 使用
```typescript
import { MoveParser, tokenizeMove } from '@nuwa.sui/move-ast'

const parser = new MoveParser()
parser.input = tokenizeMove(`...`)
parser.parseModule()
```
