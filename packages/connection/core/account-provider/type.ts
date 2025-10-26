import type { SuiAddress } from "@nuwa.sui/types"
import type { Transaction } from "@mysten/sui/transactions"
import type { SuiChain, SuiFeatures, StandardFeatures, WalletAccount } from '@mysten/wallet-standard'

export type AllFeaturesString = keyof SuiFeatures | keyof StandardFeatures

export interface SuiAccount {
    address: SuiAddress
    /** find path: domain > name > address */
    label: string
    chains: SuiChain[]
    name?: string
    icon_url?: string
    publicKey?: Uint8Array | string | any
    features?: AllFeaturesString[]
}

export interface AccountProvider {
    get accounts(): WalletAccount[]
    readonly account: WalletAccount | undefined
    readonly chain: SuiChain | undefined

    readonly meta: {
        /** wallet name */
        readonly name: string | undefined
        /** wallet icon url */
        readonly icon_url: string | undefined
        readonly supported_chains: SuiChain[]
        readonly supported_features: AllFeaturesString[]
    }

    setChain(chain: SuiChain): void
    setAccount(arg: SuiAddress | WalletAccount | ((accounts: WalletAccount[]) => WalletAccount)): void
    onDisconnect(callback: () => void): void
    onAccountChange(callback: (accounts: WalletAccount[]) => void): void

    disconnect(): Promise<void>
    signTransaction(tx: Transaction): Promise<Uint8Array>
    signPersonalMessage(message: Uint8Array | string): Promise<Uint8Array>
    reportTransactionEffects(rawEffect: Uint8Array): Promise<void>
}