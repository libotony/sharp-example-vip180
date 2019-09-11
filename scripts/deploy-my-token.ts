import '@libotony/sharp-cli/script'
import { ContractMeta, Awaiter } from '@libotony/sharp'

const myTokenContract = require('../output/MyToken.json')
const myToken = new ContractMeta(myTokenContract.abi, myTokenContract.bytecode)

const thor = global.connex.thor
const vendor = global.connex.vendor
const wallet = global.wallet

wallet.import('0xdce1443bd2ef0c2631adc1c67e5c93f13dc23a41c18b536effbbdcbcdb96fb65')

const main = async () => {

    const { txid } = await vendor
        .sign('tx')
        .request([myToken.deploy().asClause()])

    console.log(`tx sent: ${txid}, waiting receipt......`)
    const receipt = await Awaiter.receipt(thor.transaction(txid), thor.ticker())
    if (receipt.reverted) {
        console.log('Failed to deploy contract')
    } else {
        console.log('Contract deployed at ' + receipt.outputs[0].contractAddress)
    }

}

export default main
