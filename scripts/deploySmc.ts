import {Address, Dictionary, toNano} from '@ton/core';
import { Smc } from '../wrappers/Smc';
import { compile, NetworkProvider } from '@ton/blueprint';
import {randomAddress} from "@ton/test-utils";

export async function run(provider: NetworkProvider) {

    let dict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.BigVarUint(4));

    dict.set(randomAddress(), toNano('1'));
    dict.set(randomAddress(), toNano('2'));

    const smc = provider.open(Smc.createFromConfig({
        admin: provider.sender().address as Address,
        dict: dict
    }, await compile('Smc')));

    await smc.sendDeploy(provider.sender(), toNano('4'));

    await provider.waitForDeploy(smc.address);

    // run methods on `smc`
}
