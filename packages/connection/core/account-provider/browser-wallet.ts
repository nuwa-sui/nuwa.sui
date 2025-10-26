import type { AccountProvider } from "./type"
import type { WalletWithRequiredFeatures, StandardConnectInput } from "@mysten/wallet-standard"

async function createBrowserAccountProvider(opts: {
    wallet: WalletWithRequiredFeatures,
    connectOptions: StandardConnectInput
}): Promise<AccountProvider> {
    const { wallet, connectOptions } = opts

    await wallet.features['standard:connect'].connect(connectOptions)

    wallet.
    return {
        get accounts() {
            return []
        },
    }
}