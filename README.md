# Sharp example project

Compile/Test/Deploy/Interact with contracts by *CONNEX*.

## Overview

+ Write contract code in your favorite editor(VSCode is mine)
+ Compile contracts to meta by `sharp-cli compile`
+ Test contracts in solo by `sharp-cli test [npm task name]`
+ Deploy/Interact with contract by scripts by `sharp-cli exec [path to script]`

## Project structure

``` shell
.
├── contracts     # contracts directory
│   ...
│   └── my-token.sol
├── output        # compiled contracts meta
├── package.json
├── scripts       # custom scripts
...
└── tests         # tests
```

## Bootstrap

``` shell
npm i @libotony/sharp @libotony/sharp-cli --save
```

## Setup compiler

Configuration of sharp is located in `package.json`, under the namespace of `sharp`. For the complete guide of configuration, check [sharp-cli](https://github.com/libotony/sharp-cli). In this project we just need to specify the files need to to be compiled in `sharp.contracts`. 

``` javascript
// package.json
{  
    "sharp": {
        "contracts_directory": "contracts",
        "contracts": [
            "my-token.sol"
        ],
        "build_directory": "output",
        "solc": {
            ... // solidity compiler options
        }
    }
}
```

## NPM scripts

### Compile contract

Just run the following command, `sharp-cli` will read configurations from `package.json` and compile the contracts.

``` shell
npm run compile
```

### Run tests

``` shell
npm run test/npm test/npm t
```

### Deploy contract

`sharp-cli exec [file]` will create a running environment for user script, it is useful for developers deploying contracts or running customized scripts. In this project I made an example of deploying the contract.

``` shell
npm run deploy
```

## Write test suites

Command `sharp-cli test [task]` will start a solo node in the background and then start a npm task which is aiming to run tests. In the project, I used the well know framework `mocha`.

### 0x00 - setup connex

We need to setup `connex` first, to run the tests `sharp-cli` will start a solo node in the background and set the environment variable `THOR_REST` for us to initiate connex. See [connex-loader](./tests/connex-loader.ts) for the detail.

``` typescript
import { Framework } from '@vechain/connex-framework'
import { Driver, SimpleNet, SimpleWallet } from '@vechain/connex.driver-nodejs'

const wallet = new SimpleWallet()
// setup wallets here

const genesis = {...solo genesis}

const net = new SimpleNet(process.env.THOR_REST)
const driver = new Driver(net, genesis, undefined, wallet)
const connex = new Framework(driver)

```

### 0x01 - deploy contract

In this part, we will need [sharp](https://github.com/libotony/sharp) to get tests written. First we need `ContractMeta` to manage contract meta info.

``` typescript
import { ContractMeta } from 'sharp'

const myTokenContract = require('../output/MyToken.json')
const myToken = new ContractMeta(myTokenContract.abi, myTokenContract.bytecode)

// Get the ABI description of method 'balanceOf'
const abi0 = myToken.ABI('balanceOf')
// Get the ABI description of event 'Transfer'
const abi1 = myToken.ABI('Transfer', 'event')

//Build the deploy clause
const clause = contract
    .deploy()
    .value(100)             //100wei as endowment for contract creation
    .asClause(arg0, arg1)   //args for constructor

/* For my-token */
const { txid } = await vendor
        .signer(addrOne) // specify the signer, it will get the total supply based on the contract logic
        .sign('tx')
        .request([myToken.deploy().asClause()])
```

### 0x02 - wait for receipt

After send the transaction, we need to wait for the transaction to be packed.

``` typescript
import { Awaiter } from 'sharp'

const receipt = await Awaiter.receipt(thor.transaction(txid), thor.ticker())
```

### 0x03 - the assertion of receipt

We should assert the emitted contract address, revert status, event log account, event log emitted in the constructor.

``` typescript
assert.isFalse(receipt.reverted, 'Should not be reverted')
assert.equal(receipt.outputs[0].events.length, 2, 'Clause#0 should emit two events')
// output#0 should have contractAddress emitted
assert.isTrue(!!receipt.outputs[0].contractAddress)

Assertion
    // abi of the event
    .event(myToken.ABI('Transfer', 'event'))
    // the event log should be emitted by the contract
    .by(address)
    // mint from address 0, total supply is 1 billion
    .logs(zeroAddress, addrOne, toWei(1e9))
    // event located at output#0.event#1
    // first event of deploy clause is emitted from prototype
    .equal(receipt.outputs[0].events[1])
```

### 0x04 -  the assertion of contract call

First read the total supply of the token:

``` typescript
const ret = await thor.account(address)
    .method(myToken.ABI('totalSupply'))
    .call()

Assertion
    .method(myToken.ABI('totalSupply'))
    // calling method should return total supply of 1 billion
    .outputs(toWei(1e9))
    .equal(ret)
```

### 0x05 - a method would change the state

Calling a method which will change the state will not `change the statue` but you will `get the output of this action`. And you will get the output immediately without waiting for the nodes pack it in to the block.

``` typescript
const ret = await thor.account(address)
    .method(myToken.ABI('transfer'))
    .caller(addrOne)
    .call(addrTwo, toWei(100))

assert.isFalse(ret.reverted, 'Should not be reverted')
assert.equal(ret.events.length, 1, 'Output should emit one event')
Assertion
    .event(myToken.ABI('Transfer', 'event'))
    .by(address)
    .logs(addrOne, addrTwo, toWei(100))
    .equal(receipt.events[0])
```

But I want to read the state after this call, then we'll send the tx and read the state.

``` typescript
/* Send the transaction */
const { txid } = await vendor.sign('tx')
    .signer(addrOne)
    .request([
        thor.account(address)
            .method(myToken.ABI('transfer'))
            .asClause(addrTwo, toWei(100))
    ])

const receipt = await Awaiter.receipt(thor.transaction(txid), thor.ticker())

assert.isFalse(receipt.reverted, 'Should not be reverted')
assert.equal(receipt.outputs[0].events.length, 1, 'Clause#0 should emit one event')
Assertion
.event(myToken.ABI('Transfer', 'event'))
.by(address)
.logs(addrOne, addrTwo, toWei(100))
.equal(receipt.outputs[0].events[0])

/* Check addrOne balance */
const ret = await thor.account(address)
    .method(myToken.ABI('balanceOf'))
    .call(addrOne)

Assertion
    .method(myToken.ABI('balanceOf'))
    .outputs(toWei(1e9 - 100))
    .equal(ret)

/* Check addrTwo balance */
const ret = await thor.account(address)
    .method(myToken.ABI('balanceOf'))
    .call(addrTwo)

Assertion
    .method(myToken.ABI('balanceOf'))
    .outputs(toWei(100))
    .equal(ret)
```

### 0x06 - revert message assertion

In the early age of writing contracts, we even don't which part revert of a method failed. Luckily we got revert after that.

``` typescript
const ret = await thor.account(address)
    .method(myToken.ABI('transfer'))
    .caller(addrOne)
    .call(zeroAddress, toWei(100))

Assertion
    .revert()
    .with('VIP180: transfer to the zero address')
    .equal(ret)
```

### 0x07 - VET transfer assertion

``` typescript
const { txid } = await vendor.sign('tx')
    .signer(addrOne)
    .request([{
        to: addrTwo,
        value: toWei(100)
    }])

const receipt = await Awaiter.receipt(thor.transaction(txid), thor.ticker())

assert.isFalse(receipt.reverted, 'Should not be reverted')
assert.equal(receipt.outputs[0].transfers.length, 1, 'Clause#0 should emit one transfer log')
Assertion
    .transfer()
    .logs(addrOne, addrTwo, toWei(100))
    .equal(receipt.outputs[0].transfers[0])
```

### 0x98 - setup NPM script

Setting up the npm task is just the same as running tests of JS/TS project. The only difference is you need set the `test` to `sharp-cli test [npm task]`.

``` javascript
// package.json
{  
    "scripts": {
        "test": "sharp-cli test sharp",
        "sharp": "mocha './tests/my-token.test.ts'",
    }
}
```

In this project we write test codes in typescript, so we need require the register for TS.

``` javascript
{
    "sharp": "mocha --require ts-node/register './tests/my-token.test.ts'",
}
```

You may find out mocha will not exist after all tests are done, simply specify `--exit` to force mocha to quit after tests complete.


``` javascript
{
    "sharp": "mocha --require ts-node/register --exit './tests/my-token.test.ts'",
}
```

Then, `npm test` will work as we expected.

### 0x99

The full detailed contract tests are in [tests](./tests/) folder.

## Write user scripts

`sharp-cli exec [file]` will expose `connex` and `wallet` in the global context of node which will make developers feel like executing the script in the [sync](https://env.vechain.org).

For the script, `sharp` expects it export a function as the default export:

``` typescript
// CommonJS
module.exports = function async(){

}

// ECMAScript module
const main = async ()=>{

}
export default main
```

Here we write a script deploying the contract as an example:

``` typescript
// Import the script typings of extended global context, only necessary in typescript
import 'sharp-cli/script'
import { ContractMeta, Awaiter } from 'sharp'

const myTokenContract = require('../output/MyToken.json')
const myToken = new ContractMeta(myTokenContract.abi, myTokenContract.bytecode)

const thor = global.connex.thor
const vendor = global.connex.vendor
const wallet = global.wallet

// Set up wallets, the private key is sensitive information, you may need to get from environment
// wallet.import(process.env['ACC_PRIV'])
wallet.import('...')

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
```

Then setup the script in NPM script:

``` javascript
// package.json
{  
    "scripts": {
        "deploy": "sharp-cli exec scripts/deploy-my-token.ts"
    }
}
```

Add the register of TS:

``` javascript
// package.json
{  
    "deploy": "sharp-cli exec scripts/deploy-my-token.ts --require ts-node/register"
}
```

## CI - Travis

see [.travis.yml](./.travis.yml)