export type SuiAddress = `0x${string}`
export type VerifiedSuiAddress = `0x${string & { length: 64 }}`
export type SuiIdentifier = `${SuiAddress}::${string}::${string}`
