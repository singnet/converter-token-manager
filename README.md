# TokenConversionManager-Contract
Token Conversion Manager Smart Contract

# High Level Functional Requirements

ERC20 tokens like AGIX needs to be converted from Cardano to Ethereum and vice versa.

## Contracts

### TokenConversionManager
  TokenConversionManager contract is to enable token holders to lock or unlock for the: 
* AGIX-ETH to AGIX-ADA
* NTX-ETH to NTX-ADA
* RJV-ETH to RJV-ADA

## Software Requirements
* [Node.js](https://github.com/nodejs/node) (8+)
* [Npm](https://www.npmjs.com/package/npm)

## Deployed Contracts (npm version 0.1.3)
## Mainnet:

### SingularityNet Token Conversion Contract
* TokenConversionManager: [0x611192364cc6962F433A5dc52cD500A423dd7bE4](https://etherscan.io/address/0x611192364cc6962F433A5dc52cD500A423dd7bE4)
* SingularityNet Token Contract: [0x5B7533812759B45C2B44C19e320ba2cD2681b542](https://etherscan.io/token/0x5b7533812759b45c2b44c19e320ba2cd2681b542)
### Nunet Token Conversion Contract
* TokenConversionManager: [0x6C0d706c75b559549938c0b1De863cf7f042D1cf](https://etherscan.io/address/0x6c0d706c75b559549938c0b1de863cf7f042d1cf)
* Nunet Token Contract: [0xF0d33BeDa4d734C72684b5f9abBEbf715D0a7935](https://etherscan.io/address/0xF0d33BeDa4d734C72684b5f9abBEbf715D0a7935)
### Rejuve Token Conversion Contract
* TokenConversionManager: [0x4DCc70c6FCE4064803f0ae0cE48497B3f7182e5D](https://goerli.etherscan.io/address/0x4dcc70c6fce4064803f0ae0ce48497b3f7182e5d)
* Rejuve Token Contract: [0xDCBD4B7DFd41a96b60B408120213925e41c21b25 ](https://goerli.etherscan.io/address/0xdcbd4b7dfd41a96b60b408120213925e41c21b25)

## Goerli:
### SingularityNet Token Conversion Contract
* TokenConversionManager: [0xe331BF20044a5b24c1A744ABC90c1Fd711D2c08d](https://goerli.etherscan.io/address/0xe331BF20044a5b24c1A744ABC90c1Fd711D2c08d)
* SingularityNet Token Contract: [0xdd4292864063d0DA1F294AC65D74d55a44F4766C](https://goerli.etherscan.io/token/0xdd4292864063d0da1f294ac65d74d55a44f4766c)
### Nunet Token Conversion Contract
* TokenConversionManager: [0x901AC04e21324708422113859FB3bF6E1e67339C](https://goerli.etherscan.io/address/0x901AC04e21324708422113859FB3bF6E1e67339C)
* Nunet Token Contract: [0x62221B6BcF322b7E77D8Ab5Cd46a01DB8a263741](https://goerli.etherscan.io/token/0x62221B6BcF322b7E77D8Ab5Cd46a01DB8a263741)
### Rejuve Token Conversion Contract
* TokenConversionManager: [0x611192364cc6962F433A5dc52cD500A423dd7bE4](https://etherscan.io/address/0x611192364cc6962F433A5dc52cD500A423dd7bE4)
* Rejuve Token Contract: [0x5B7533812759B45C2B44C19e320ba2cD2681b542](https://etherscan.io/token/0x5b7533812759b45c2b44c19e320ba2cd2681b542)
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
