# Sharp example project

Compile/Test/Deploy/Interact solidity written contracts by *CONNEX*.

## Overview

+ Write contract code
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

## Setup compiler

Configuration of sharp is located in `package.json`, under the namespace of `sharp`. For the complete guide of configuration, check [sharp-cli](). In this project we just need to specify the files need to to be compiled in `sharp.contracts`. 

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

## Setup NPM scripts

``` javascript
// package.json
{  
    "scripts": {
        "compile": "sharp-cli compile",
        "test": "sharp-cli test ",
        "sharp": "NODE_ENV=test mocha --require ts-node/register --timeout 20000 --exit './tests/my-token.test.ts'",
        "deploy": "sharp-cli exec scripts/deploy-my-token.ts --require ts-node/register"
    }
}
```

### Compile contract

Just run the following command, `sharp-cli` will read configurations from `package.json` and compile the contracts.

``` shell
npm run compile
```

### Running tests

``` shell
npm run test/npm test/npm t
```

**Notes:** You need specify `--exit` which forces mocha to quit after tests complete.

### Deploy contract

`sharp-cli exec [file]` will create a running environment for user script, it is useful for users deploying contracts or running customized scripts. In this project I made an example of deploying the contract.

``` shell
npm run deploy
```

## Write test suites


## Write user scripts

