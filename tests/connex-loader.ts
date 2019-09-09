import { Framework } from '@vechain/connex-framework'
import { Driver, SimpleNet, SimpleWallet } from '@vechain/connex.driver-nodejs'

const wallet = new SimpleWallet()
wallet.import('0xdce1443bd2ef0c2631adc1c67e5c93f13dc23a41c18b536effbbdcbcdb96fb65')
wallet.import('0x321d6443bc6177273b5abf54210fe806d451d6b7973bccc2384ef78bbcd0bf51')
wallet.import('0x2d7c882bad2a01105e36dda3646693bc1aaaa45b0ed63fb0ce23c060294f3af2')
wallet.import('0x593537225b037191d322c3b1df585fb1e5100811b71a6f7fc7e29cca1333483e')
wallet.import('0xca7b25fc980c759df5f3ce17a3d881d6e19a38e651fc4315fc08917edab41058')
wallet.import('0x88d2d80b12b92feaa0da6d62309463d20408157723f2d7e799b6a74ead9a673b')
wallet.import('0xfbb9e7ba5fe9969a71c6599052237b91adeb1e5fc0c96727b66e56ff5d02f9d0')
wallet.import('0x547fb081e73dc2e22b4aae5c60e2970b008ac4fc3073aebc27d41ace9c4f53e9')
wallet.import('0xc8c53657e41a8d669349fc287f57457bd746cb1fcfc38cf94d235deb2cfca81b')
wallet.import('0x87e0eba9c86c494d98353800571089f316740b0cb84c9a7cdf2fe5c9997c7966')

const genesis = {
    number: 0,
    id: '0x00000000973ceb7f343a58b08f0693d6701a5fd354ff73d7058af3fba222aea4',
    size: 170,
    parentID: '0xffffffff00000000000000000000000000000000000000000000000000000000',
    timestamp: 1526400000,
    gasLimit: 10000000,
    beneficiary: '0x0000000000000000000000000000000000000000',
    gasUsed: 0,
    totalScore: 0,
    txsRoot: '0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0',
    txsFeatures: 0,
    stateRoot: '0x278b34bdbc5294d0cbbb7f1c49100c821e6fff7abc69a0c398c8f27d00563a8e',
    receiptsRoot: '0x45b0cfc220ceec5b7c1c62c4d4193d38e4eba48e8815729ce75f9c0ab0e4c1c0',
    signer: '0x0000000000000000000000000000000000000000',
    isTrunk: true,
    transactions: []
}

const net = new SimpleNet(process.env.THOR_REST as string)
const driver = new Driver(net, genesis, undefined, wallet)
const connex = new Framework(driver)

export {
    connex,
    wallet
}
