import {Blockchain, printTransactionFees, SandboxContract, TreasuryContract} from '@ton/sandbox';
import {Cell, Dictionary, beginCell, toNano} from '@ton/core';
import {Smc} from '../wrappers/Smc';
import '@ton/test-utils';
import {compile} from '@ton/blueprint';

describe('Smc', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Smc');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let account1: SandboxContract<TreasuryContract>;
    let account2: SandboxContract<TreasuryContract>
    let smc: SandboxContract<Smc>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        admin = await blockchain.treasury('admin');
        account1 = await blockchain.treasury('account1');
        account2 = await blockchain.treasury('account2');
        let dict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.BigVarUint(4));

        dict.set(account1.address, toNano('2'));
        dict.set(account2.address, toNano('3'));


        smc = blockchain.openContract(
            Smc.createFromConfig({
                    admin: admin.address,
                    dict: dict
                },
                code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await smc.sendDeploy(deployer.getSender(), toNano('10'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: smc.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        expect((await blockchain.getContract(smc.address))
            .balance
        )
            .toEqual(9999585000n);

        expect((await blockchain.getContract(smc.address))
            .get('get_value_by_address', [
                {
                    type: 'slice',
                    cell: beginCell().storeAddress(account1.address).endCell()
                }
            ])
            .stackReader.readBigNumber()
        )
            .toEqual(toNano('2'))

    });

    it('should send funds to provided address', async () => {

        const payOutRequestResult = await smc.sendPayoutRequest(admin.getSender(), account1.address);

        expect(payOutRequestResult.transactions).toHaveTransaction({
                from: smc.address,
                to: account1.address,
                value: toNano('2'),
            });
        printTransactionFees(payOutRequestResult.transactions)
    })
});
