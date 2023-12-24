import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode,
    toNano
} from '@ton/core';

export type SmcConfig = {
    admin: Address;
    dict: Dictionary<Address, bigint>
};

export function smcConfigToCell(config: SmcConfig): Cell {
    return beginCell()
        .storeAddress(config.admin)
        .storeDict(config.dict)
        .endCell();
}

export class Smc implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new Smc(address);
    }

    static createFromConfig(config: SmcConfig, code: Cell, workchain = 0) {
        const data = smcConfigToCell(config);
        const init = {code, data};
        return new Smc(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendPayoutRequest(provider: ContractProvider, via: Sender, toAddress: Address) {
        await provider.internal(via, {
            value: toNano('0.05'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(1, 32)
                .storeAddress(toAddress)
                .endCell(),
        });

    }
}
