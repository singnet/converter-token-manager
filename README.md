# TokenConversionManager-Contract
Token Conversion Manager Smart Contract

# High Level Functional Requirements

ERC20 tokens like AGIX needs to be converted from Cardano to Ethereum and vice versa.

## Contracts

### TokenConversionManager
* TokenConversionManager contract is to enable token holders to lock or unlock for the AGI-ETH to AGI-ADA.

## Software Requirements
* [Node.js](https://github.com/nodejs/node) (8+)
* [Npm](https://www.npmjs.com/package/npm)

## Deployed Contracts (npm version 0.1.0)

* TokenConversionManager (Mainnet): [Address Placeholder] (etherscan URL PLaceholder)
* TokenConversionManager (Ropsten): [Address Placeholder] (etherscan URL PLaceholder)
* TokenConversionManager (Kovan): [Address Placeholder] (etherscan URL PLaceholder)

## Nunet Conversion Contract
* TokenConversionManager (Goerli): [0x901AC04e21324708422113859FB3bF6E1e67339C] (https://goerli.etherscan.io/address/0x901AC04e21324708422113859FB3bF6E1e67339C)
* Nunet Token Contract: [0x62221B6BcF322b7E77D8Ab5Cd46a01DB8a263741] (https://goerli.etherscan.io/address/0x62221B6BcF322b7E77D8Ab5Cd46a01DB8a263741)


## SingularityNet Conversion Contract
* TokenConversionManager (Goerli): [0xe331BF20044a5b24c1A744ABC90c1Fd711D2c08d] (https://goerli.etherscan.io/address/0xe331BF20044a5b24c1A744ABC90c1Fd711D2c08d)
* SingularityNet Token Contract: [0xdd4292864063d0DA1F294AC65D74d55a44F4766C] (https://goerli.etherscan.io/address/0xdd4292864063d0DA1F294AC65D74d55a44F4766C)

## Install

### Dependencies
```bash
npm install
```

### Compile 
```bash
truffle compile
```

### Test 
```bash
truffle test
```

## Package
```bash
npm run package-npm
```

## Release
Contract build artifacts are published to NPM: https://www.npmjs.com/package/singularitynet-token-manager
