import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'

const client = new SuiClient({
    url: getFullnodeUrl('mainnet'),
})

interface ContractABI {
    [key: string]: {
        functions: [],
        events: [],
        objects: []
    }

}

interface Contract {
    functions: []
    events: []
}

export async function useObject(_addr: String, options: {
    lazy: boolean,
}){
    return {} as {
        addr: string,
        content: Record<string, any>,
        dynamicFields: Record<string, any>,
    
        refresh(options: {
            content: boolean,
            dynamicFields: string[] | boolean,
        }): Promise<void>,
    }
}

export async function useBalance(options: {
    accounts: String[],
    coinType: String,
}){}


export function useAccount(_addr: String, options: {
    perferredDisplay: ('name' | 'nsName' | 'address')[]
}) {
    return {
        address() {},
        display() {},
        nsName() {},

        // Qeury
        async useObject(){},
        async useObjects(){},
        async useTransactionBlocks(){},
        async useAllBalances(){},
        async useBalance(){},
        async useAllCoins(){},

        // Action
        async useTransaction(cb: (composeables: {
            tx: Transaction,
            client: SuiClient,

            // default-contract
            contract: Contract,

            // all-contracts
            contracts: Record<string, Contract>,
        }) => any, _options: {
            // 是否在本地执行，而非使用钱包执行
            local: boolean,
        }){},

        async getSpecifyAmountCoin(options: {
            safety: boolean,
        }){},
        
        async mergeAllCoin(options: {
            // 当数量过多时，分为多次发送 tx
            safety: boolean,
        }){},

    }
}

export function useWallet() {
    return {
        _rawWallet() {},
        async connect() {},
        async disconnect() {},
        async switchAccount() {},
    }
}