import { createToken, Lexer } from 'chevrotain'

export const Comment = createToken({
    name: 'Comment',
    pattern: /\/\/.*/,
    group: Lexer.SKIPPED,
})

export const BlockComment = createToken({
    name: 'BlockComment',
    pattern: /\/\*[\s\S]*?\*\//,
    group: Lexer.SKIPPED,
})

export const WhiteSpace = createToken({
    name: 'WhiteSpace',
    pattern: /\s+/,
    group: Lexer.SKIPPED,
})

// 包括 Identifier, 可以用作变量名的关键字或者符号
export const Literal = createToken({ name: 'Literal', pattern: Lexer.NA })

// Operations
export const Operations = createToken({ name: 'Operation', pattern: Lexer.NA })
export const LessThan = createToken({ name: 'LessThan', pattern: /</, categories: [Operations] })
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ })
export const LessEqual = createToken({ name: 'LessEqual', pattern: /<=/ })
export const GreaterEqual = createToken({ name: 'GreaterEqual', pattern: />=/ })
export const NotEqual = createToken({ name: 'NotEqual', pattern: /!=/ })
export const Plus = createToken({ name: 'Plus', pattern: /\+/ })
export const Minus = createToken({ name: 'Minus', pattern: /-/ })
export const Star = createToken({ name: 'Star', pattern: /\*/ })
export const Slash = createToken({ name: 'Slash', pattern: /\// })
export const Percent = createToken({ name: 'Percent', pattern: /%/ })
export const Equal = createToken({ name: 'Equal', pattern: /=/ })
export const DoubleEqual = createToken({ name: 'DoubleEqual', pattern: /==/ })
export const Bang = createToken({ name: 'Bang', pattern: /!/ })
export const And = createToken({ name: 'And', pattern: /&/ })
export const Or = createToken({ name: 'Or', pattern: /\|/ })
export const Xor = createToken({ name: 'Xor', pattern: /\^/ })

// conflict with LessThan and GreaterThan
// export const ShiftLeft = createToken({name: 'ShiftLeft', pattern: /<</})
// export const ShiftRight = createToken({name: 'ShiftRight', pattern: />>/})

export const Colon = createToken({ name: 'Colon', pattern: /:/ })
export const DoubleColon = createToken({ name: 'DoubleColon', pattern: /::/ })
export const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ })
export const OpenParen = createToken({ name: 'OpenParen', pattern: /\(/ })
export const CloseParen = createToken({ name: 'CloseParen', pattern: /\)/ })
export const OpenCurly = createToken({ name: 'OpenCurly', pattern: /\{/ })
export const CloseCurly = createToken({ name: 'CloseCurly', pattern: /\}/ })
export const Comma = createToken({ name: 'Comma', pattern: /,/ })
export const Dollar = createToken({ name: 'Dollar', pattern: /\$/ })
export const Dot = createToken({ name: 'Dot', pattern: /\./ })
export const Sharp = createToken({ name: 'Sharp', pattern: /#/ })
export const LeftBracket = createToken({ name: 'LeftBracket', pattern: /\[/ })
export const RightBracket = createToken({ name: 'RightBracket', pattern: /\]/ })
// export const Quote = createToken({name: 'Quote', pattern: /"/})
// export const SingleQuote = createToken({name: 'SingleQuote', pattern: /'/})

// export const Vector = createToken({name: 'Vector', pattern: /vector/, categories: [Literal]})

// 变量声明关键字
export const Let = createToken({ name: 'Let', pattern: /\blet\b/ })
export const Const = createToken({ name: 'Const', pattern: /\bconst\b/ })
export const Mut = createToken({ name: 'Mut', pattern: /\bmut\b/ })

// 控制流关键字
export const ControlFlow = createToken({ name: 'ControlFlow', pattern: Lexer.NA })
export const If = createToken({ name: 'If', pattern: /\bif\b/, categories: [ControlFlow] })
export const Else = createToken({ name: 'Else', pattern: /\belse\b/, categories: [ControlFlow] })
export const While = createToken({ name: 'While', pattern: /\bwhile\b/, categories: [ControlFlow] })
export const Return = createToken({ name: 'Return', pattern: /\breturn\b/, categories: [ControlFlow] })
export const Break = createToken({ name: 'Break', pattern: /\bbreak\b/, categories: [ControlFlow] })
export const Continue = createToken({ name: 'Continue', pattern: /\bcontinue\b/, categories: [ControlFlow] })
export const Loop = createToken({ name: 'Loop', pattern: /\bloop\b/, categories: [ControlFlow] })
export const For = createToken({ name: 'For', pattern: /\bfor\b/, categories: [ControlFlow] })
export const Abort = createToken({ name: 'Abort', pattern: /\babort\b/, categories: [ControlFlow] })
export const Assert = createToken({ name: 'Assert', pattern: /\bassert!/, categories: [ControlFlow] })

// move 关键字
export const As = createToken({ name: 'As', pattern: /\bas\b/ })
export const Use = createToken({ name: 'Use', pattern: /\buse\b/ })
export const FunctionModifiers = createToken({ name: 'FunctionModifiers', pattern: Lexer.NA })
export const PublicWithParam = createToken({ name: 'PublicWithParam', pattern: Lexer.NA, categories: [FunctionModifiers] })
export const Macro = createToken({ name: 'Macro', pattern: /\bmacro\b/, categories: [FunctionModifiers, Literal] })
export const Native = createToken({ name: 'Native', pattern: /\bnative\b/, categories: [FunctionModifiers] })
export const PublicFriend = createToken({ name: 'PublicFriend', pattern: /\bpublic\(friend\)/, categories: [FunctionModifiers, PublicWithParam] })
export const PublicPackage = createToken({ name: 'PublicPackage', pattern: /\bpublic\(package\)/, categories: [FunctionModifiers, PublicWithParam] })
export const Public = createToken({ name: 'Public', pattern: /\bpublic\b/, categories: [FunctionModifiers, PublicWithParam] })
export const Entry = createToken({ name: 'Entry', pattern: /\bentry\b/, categories: [FunctionModifiers, Literal] })

export const Fun = createToken({ name: 'Function', pattern: /\bfun\b/ })
export const Module = createToken({ name: 'Module', pattern: /\bmodule\b/, categories: [Literal] })
export const Struct = createToken({ name: 'Struct', pattern: /\bstruct\b/ })
export const Enum = createToken({ name: 'Enum', pattern: /\benum\b/ })

export const MoveAbilities = createToken({ name: 'MoveAbilities', pattern: Lexer.NA })
export const Has = createToken({ name: 'Has', pattern: /\bhas\b/, categories: [Literal] })
export const Key = createToken({ name: 'Key', pattern: /\bkey\b/, categories: [MoveAbilities, Literal] })
export const Store = createToken({ name: 'Store', pattern: /\bstore\b/, categories: [MoveAbilities, Literal] })
export const Copy = createToken({ name: 'Copy', pattern: /\bcopy\b/, categories: [MoveAbilities] })
export const Drop = createToken({ name: 'Drop', pattern: /\bdrop\b/, categories: [MoveAbilities, Literal] })
export const Phantom = createToken({ name: 'Phantom', pattern: /\bphantom\b/, categories: [Literal] })

// Literal-Value
export const LiteralValue = createToken({ name: 'LiteralValue', pattern: Lexer.NA })
export const LiteralAddress = createToken({ name: 'Address', pattern: /@\w+\b/, categories: [LiteralValue] })
export const LiteralIntegers = createToken({ name: 'Integers', pattern: /\b\d[\d_]*(u256|u128|u64|u32|u16|u8)?\b/, categories: [LiteralValue] })
export const LiteralHex = createToken({ name: 'Hex', pattern: /\b0x[0-9a-fA-F]+\b/, categories: [LiteralValue] })
export const LiteralString = createToken({ name: 'String', pattern: /b?"[^"]*"/, categories: [LiteralValue] })
// eslint-disable-next-line regexp/no-dupe-disjunctions
export const Identifier = createToken({ name: 'Identifier', pattern: /\b[a-z_]\w*\b|`[a-z_]\w*`|\b_\b/i, categories: [Literal] })

export const Others = createToken({ name: 'Others', pattern: /./ })

export const allTokens = [
    Comment,
    BlockComment,

    LiteralValue,
    LiteralAddress,
    LiteralIntegers,
    LiteralHex,
    LiteralString,

    WhiteSpace,
    // MoveAttribute,

    // 标点符号
    DoubleColon,
    Colon,
    LessEqual,
    LessThan,
    GreaterEqual,
    GreaterThan,
    OpenParen,
    CloseParen,
    OpenCurly,
    CloseCurly,
    Comma,
    Dollar,
    Plus,
    Minus,
    Semicolon,
    Star,
    Slash,
    Percent,
    DoubleEqual,
    Equal,
    NotEqual,
    Bang,
    And,
    Or,
    Xor,
    Operations,
    Dot,
    Sharp,
    LeftBracket,
    RightBracket,
    // Quote,
    // SingleQuote,

    // move keywords
    Mut,
    Let,
    Const,
    If,
    Else,
    While,
    Return,
    Break,
    Continue,
    Loop,
    For,

    Abort,
    Assert,
    // Vector,

    Use,
    As,
    Module,
    Struct,
    Enum,
    FunctionModifiers,
    Macro,
    Native,
    PublicFriend,
    PublicPackage,
    Public,
    Entry,
    Fun,
    MoveAbilities,
    Has,
    Key,
    Store,
    Copy,
    Drop,
    Phantom,

    // Identifier must appear after the keywords
    Identifier,
    Literal,
    Others,
]

export const MoveLexer = new Lexer(allTokens)
