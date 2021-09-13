let TokenConversionManager = artifacts.require("./TokenConversionManager.sol");
let Contract = require("@truffle/contract");
let TokenAbi = require("singularitynet-token-contracts/abi/SingularityNetToken.json");
let TokenNetworks = require("singularitynet-token-contracts/networks/SingularityNetToken.json");
let TokenBytecode = require("singularitynet-token-contracts/bytecode/SingularityNetToken.json");
let Token = Contract({contractName: "SingularityNetToken", abi: TokenAbi, networks: TokenNetworks, bytecode: TokenBytecode});

// Token Contract Constants
const name = "SingularityNET Token"
const symbol = "AGIX"

module.exports = function(deployer, network, accounts) {
    Token.setProvider(web3.currentProvider)
    Token.defaults({from: accounts[0], gas: 4000000});

    // AGI-II Contract deployment 
    deployer.deploy(Token, name, symbol, {overwrite: false, gas: 4000000}).then((TokenInstance) => deployer.deploy(TokenConversionManager, TokenInstance.address));

};
