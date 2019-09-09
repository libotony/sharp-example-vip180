import 'sharp-cli/script'
import { ContractMeta } from 'sharp'

const account = '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed'
const contractAddress = '0x921b47242b347c5e214a26316e5c284fba8ebaff'

const myTokenContract = require('../output/MyToken.json')
const myToken = new ContractMeta(myTokenContract.abi, myTokenContract.bytecode)

const connex = global.connex
const balanceOf = connex.thor.account(contractAddress).method(myToken.ABI('balanceOf'))

const main = async () => {
    const ret = await balanceOf.call(account)
    console.log(ret.decoded!['0'])
}

export default main
