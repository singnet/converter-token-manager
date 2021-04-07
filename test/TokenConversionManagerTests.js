"use strict";
var  TokenConversionManager = artifacts.require("./TokenConversionManager.sol");

let Contract = require("@truffle/contract");
let TokenAbi = require("singularitynet-token-contracts/abi/SingularityNetToken.json");
let TokenNetworks = require("singularitynet-token-contracts/networks/SingularityNetToken.json");
let TokenBytecode = require("singularitynet-token-contracts/bytecode/SingularityNetToken.json");
let Token = Contract({contractName: "SingularityNetToken", abi: TokenAbi, networks: TokenNetworks, bytecode: TokenBytecode});
Token.setProvider(web3.currentProvider);

var ethereumjsabi  = require('ethereumjs-abi');
var ethereumjsutil = require('ethereumjs-util');
let signFuns       = require('./sign_funcs');

const { assert } = require("chai");

async function testErrorRevert(prom)
{
    let rezE = -1
    try { await prom }
    catch(e) {
        rezE = e.message.indexOf('revert');
        //console.log("Catch Block: " + e.message);
    }
    assert(rezE >= 0, "Must generate error and error message must contain revert");
}
  
contract('TokenConversionManager', function(accounts) {

console.log("Number of Accounts - ", accounts.length)

    var tokenConversionManager;
    var tokenAddress;
    var token;
    
    let GAmt = 10000  * 100000000;
    const max = 100;
    const amount_a1 =  10 * 100000000;

    before(async () => 
        {
            tokenConversionManager = await TokenConversionManager.deployed();
            tokenAddress = await tokenConversionManager.token.call();
            token = await Token.at(tokenAddress);
        });



        const approveTokensToContract = async(_startAccountIndex, _endAccountIndex, _depositAmt) => {
            // Transfer & Approve amount for respective accounts to Contract Address
            for(var i=_startAccountIndex;i<=_endAccountIndex;i++) {
                await token.transfer(accounts[i],  _depositAmt, {from:accounts[0]});
                await token.approve(tokenConversionManager.address,_depositAmt, {from:accounts[i]});
            }

        };

        const updateOwnerAndVerify = async(_newOwner, _account) => {

            let newOwner = "0x0"

            const owner_b = await tokenConversionManager.owner.call();
            await tokenConversionManager.transferOwnership(_newOwner, {from:_account});

            // Following lines of code if for Claimable Contract - which extends ownable functionality
            /*
            // Owner should not be updated until new Owner Accept the Ownership
            newOwner = await tokenConversionManager.owner.call();
            assert.equal(newOwner, owner_b);

            // Call the function to accept the ownership
            await tokenConversionManager.claimOwnership({from:_newOwner});
            */
            newOwner = await tokenConversionManager.owner.call();

            assert.equal(newOwner, _newOwner);

        }

        const updateAuthorizerAndVeryfy = async(_authorizer, _account) => {

            await tokenConversionManager.updateAuthorizer(_authorizer, {from:_account});

            // Get the Updated Conversion Authorizer
            const authorizer = await tokenConversionManager.conversionAuthorizer.call();
            assert.equal(authorizer, _authorizer);

        }

        const lockTokensAndVerify = async(_amount, _account) => {

            // Token Balance
            const wallet_bal_b = (await token.balanceOf(_account)).toNumber();
            const contract_bal_b = (await token.balanceOf(tokenConversionManager.address)).toNumber();

            const balance_b = (await tokenConversionManager.balance.call()).toNumber();

            // Call Lock Tokens
            await tokenConversionManager.lockTokens(_amount, {from:_account});

            // Token Balance
            const wallet_bal_a = (await token.balanceOf(_account)).toNumber();
            const contract_bal_a = (await token.balanceOf(tokenConversionManager.address)).toNumber();

            const balance_a = (await tokenConversionManager.balance.call()).toNumber();

            // Wallet Balance Should Reduce
            assert.equal(wallet_bal_a, wallet_bal_b - _amount);

            // Contract Balance Should Increase
            assert.equal(contract_bal_a, contract_bal_b + _amount);

            // Balance in the contract Should increase
            assert.equal(balance_a, balance_b + _amount);

        }

        const getRandomNumber = (max) => {
            const min = 10; // To avoid zero rand number
            return Math.floor(Math.random() * (max - min) + min);
        }

        const sleep = async (sec) => {
            console.log("Waiting for cycle to complete...Secs - " + sec);
            return new Promise((resolve) => {
                setTimeout(resolve, sec * 1000);
              });
        }


    // ************************ Test Scenarios Starts From Here ********************************************

    it("0. Initial Account Setup - Transfer & Approve Tokens", async function() 
    {
        // accounts[0] -> Contract Owner
        // accounts[1] to accounts[8] -> Token Holder
        // accounts[9] -> Conversion Authorizer

        // An explicit call is required to mint the tokens for AGI-II
        //await token.mint(accounts[0], GAmt, {from:accounts[0]});

        await approveTokensToContract(1, 9, GAmt);

    });

    it("1. Administrative Operations - Update Owner", async function() 
    {

        // Change the Owner to Accounts[1]
        await updateOwnerAndVerify(accounts[1], accounts[0]);

        // Revert to back the ownership to accounts[0]
        await updateOwnerAndVerify(accounts[0], accounts[1]);

        // Owner Cannot be updated by any other user
        await testErrorRevert(tokenConversionManager.transferOwnership(accounts[1], {from:accounts[2]}));

    });

    it("2. Administrative Operations - Update Conversion Authorizer", async function() 
    {

        // Update the Authorizer to accounts[9]
        await updateAuthorizerAndVeryfy(accounts[9], accounts[0]);

        // Authorizer should be uodated only by Owner
        await testErrorRevert(tokenConversionManager.updateAuthorizer(accounts[8], {from:accounts[1]}));

        // Even the authorizer cannot update to another authorizer
        await testErrorRevert(tokenConversionManager.updateAuthorizer(accounts[8], {from:accounts[9]}));

    });


    it("3. Lock Tokens by User", async function() 
    {

        // Lock of tokens from Account-1
        await lockTokensAndVerify(amount_a1, accounts[1]);

    });


    it("3. UnLock Tokens by User - Signature from Authorizer", async function() 
    {

        const max = 100;
        const lockAmount_a1 =  getRandomNumber(max) * 100000000;

        let blockNumber = await web3.eth.getBlockNumber();
        let sourceAddress = "addr_test1vq4pfxeknh5v3vlwlj9pt34ac9rk5zyw6nlc2hxh2aq9rssjlqrsj";
        let sourceAddressHex = web3.utils.asciiToHex(sourceAddress);
        let sourceAddressBytes = web3.utils.hexToBytes(sourceAddressHex)
        let sourceAddressBuffer = Buffer.from(sourceAddressHex, 'hex')


        console.log("sourceAddress - ", sourceAddress);
        console.log("sourceAddressHex - ", sourceAddressHex);
        console.log("sourceAddressBytes - ", sourceAddressBytes);
        console.log("buffer - ", Buffer.from(sourceAddressHex, 'hex'));

        //sign message by the private key of conversion authorizer accounts[9]
        let sgn = await signFuns.waitSignedMessage(accounts[9], amount_a1, accounts[1], blockNumber, tokenConversionManager.address, sourceAddressBuffer);

        let vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));
console.log("here....")
        // With Signature Parameter
        await tokenConversionManager.unLockTokens(amount_a1, blockNumber, sourceAddressBuffer, vrs.v, vrs.r, vrs.s, {from:accounts[1]});

    });


});
