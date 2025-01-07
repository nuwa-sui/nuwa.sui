import type { SuiAddress, VerifiedSuiAddress } from '@nuwa.sui/types/LiteralTypes'
import { formatAddress } from '@mysten/sui/utils'

export function formatSuiAddress(addr: SuiAddress): VerifiedSuiAddress {
    return formatAddress(addr) as VerifiedSuiAddress
}
