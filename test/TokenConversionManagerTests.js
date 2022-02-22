"use strict";
var  TokenConversionManager = artifacts.require("./TokenConversionManager.sol");
const { BN, expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');

let Contract = require("@truffle/contract");
let TokenAbi = require("singularitynet-token-contracts/abi/SingularityNetToken.json");
let TokenNetworks = require("singularitynet-token-contracts/networks/SingularityNetToken.json");
let TokenBytecode = require("singularitynet-token-contracts/bytecode/SingularityNetToken.json");
let Token = Contract({contractName: "SingularityNetToken", abi: TokenAbi, networks: TokenNetworks, bytecode: TokenBytecode});
Token.setProvider(web3.currentProvider);

var ethereumjsabi  = require('ethereumjs-abi');
var ethereumjsutil = require('ethereumjs-util');
let signFuns       = require('./sign_funcs');

var uuid = require('uuid');

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
    
    let factor = 1 * 10**8;
    let GAmt = 10000  * factor;
    const max = 100;
    const amount_a1 =  10 * factor;

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

        const updateConfigurationsAndVerify = async(_perTxnMinAmount, _perTxnMaxAmount, _maxSupply, _account) => {

            // Update the configurations
            await tokenConversionManager.updateConfigurations(_perTxnMinAmount, _perTxnMaxAmount, _maxSupply, {from:_account});

            // Get the values after the updation
            const perTxnMinAmount = (await tokenConversionManager.perTxnMinAmount.call()).toNumber();
            const perTxnMaxAmount =  (await tokenConversionManager.perTxnMaxAmount.call()).toNumber();
            const maxSupply = (await tokenConversionManager.maxSupply.call()).toNumber();


            // Check the Values
            assert.equal(perTxnMinAmount, _perTxnMinAmount);
            assert.equal(perTxnMaxAmount, _perTxnMaxAmount);
            assert.equal(maxSupply, _maxSupply);

        }

        

        const conversionOutAndVerify = async(_amount, _account, _conversionIdInHex, _v, _r, _s) => {

            // Token Balance
            const wallet_bal_b = (await token.balanceOf(_account)).toNumber();

            // total supply
            const totalSupply_b = (await token.totalSupply()).toNumber();

            // Call Lock Tokens
            await tokenConversionManager.conversionOut(_amount, _conversionIdInHex, _v, _r, _s, {from:_account});

            // Token Balance
            const wallet_bal_a = (await token.balanceOf(_account)).toNumber();

            // total supply
            const totalSupply_a = (await token.totalSupply()).toNumber();

            // Wallet Balance Should Reduce
            assert.equal(wallet_bal_a, wallet_bal_b - _amount);

            // Total Supply should reduce
            assert.equal(totalSupply_a, totalSupply_b - _amount);

        }

        const conversionInAndVerify = async(_to, _amount, _account, _conversionIdInHex, _v, _r, _s) => {

            // Token Balance
            const wallet_bal_b = (await token.balanceOf(_to)).toNumber();

            // total supply
            const totalSupply_b = (await token.totalSupply()).toNumber();

            // Call Lock Tokens
            await tokenConversionManager.conversionIn(_to, _amount, _conversionIdInHex, _v, _r, _s, {from:_account});

            // Token Balance
            const wallet_bal_a = (await token.balanceOf(_to)).toNumber();

            // total supply
            const totalSupply_a = (await token.totalSupply()).toNumber();

            // Wallet Balance Should Reduce
            assert.equal(wallet_bal_a, wallet_bal_b + _amount);

            // Total Supply should reduce
            assert.equal(totalSupply_a, totalSupply_b + _amount);

        }

        const lockTokensAndVerify = async(_amount, _account) => {

            // Token Balance
            const wallet_bal_b = (await token.balanceOf(_account)).toNumber();
            const contract_bal_b = (await token.balanceOf(tokenConversionManager.address)).toNumber();

            // Call Lock Tokens
            await tokenConversionManager.lockTokens(_amount, {from:_account});

            // Token Balance
            const wallet_bal_a = (await token.balanceOf(_account)).toNumber();
            const contract_bal_a = (await token.balanceOf(tokenConversionManager.address)).toNumber();

            // Wallet Balance Should Reduce
            assert.equal(wallet_bal_a, wallet_bal_b - _amount);

            // Contract Balance Should Increase
            assert.equal(contract_bal_a, contract_bal_b + _amount);

        }

        const unLockTokensAndVerify = async(_amount, _blockNumber, _sourceAddressBuffer, _v, _r, _s, _account) => {

            // Token Balance
            const wallet_bal_b = (await token.balanceOf(_account)).toNumber();
            const contract_bal_b = (await token.balanceOf(tokenConversionManager.address)).toNumber();

            // Call UnLock Tokens
            await tokenConversionManager.unLockTokens(_amount, _blockNumber, _sourceAddressBuffer, _v, _r, _s, {from:_account});

            // Token Balance
            const wallet_bal_a = (await token.balanceOf(_account)).toNumber();
            const contract_bal_a = (await token.balanceOf(tokenConversionManager.address)).toNumber();

            // Wallet Balance Should Reduce
            assert.equal(wallet_bal_a, wallet_bal_b + _amount);

            // Contract Balance Should Increase
            assert.equal(contract_bal_a, contract_bal_b - _amount);

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

        const getUUID = () => {

            return uuid.v4().toString().replace(/-/g, '');

        }


    // ************************ Test Scenarios Starts From Here ********************************************

    it("0. Initial Account Setup - Transfer & Approve Tokens", async function() 
    {
        // accounts[0] -> Contract Owner
        // accounts[1] to accounts[8] -> Token Holder
        // accounts[9] -> Conversion Authorizer

        // An explicit call is required to mint the tokens for AGI-II
        await token.mint(accounts[0], GAmt, {from:accounts[0]});

        await approveTokensToContract(1, 9, 5 * amount_a1);

        // Add the tokenConversionManager as the minter in the token contract
        let role = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
        await token.grantRole(role, tokenConversionManager.address, {from:accounts[0]});

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

    it("3. Administrative Operations - Conversion Configurations", async function() 
    {

        const perTxnMinAmount = 1 * factor;
        const perTxnMaxAmount = amount_a1;
        const maxSupply = GAmt;

        // Authorizer should be uodated only by Owner
        await expectRevert(
            tokenConversionManager.updateConfigurations(perTxnMinAmount, perTxnMaxAmount, maxSupply, {from: accounts[1]}),
            "caller is not the owner"
        );

        // Update the Authorizer to accounts[9]
        await updateConfigurationsAndVerify(perTxnMinAmount, perTxnMaxAmount, maxSupply, accounts[0]);

    });

    it("4. Conversion from Eth to nonEth network", async function() 
    {

        // Conversion of tokens from Account-1
        let conversionId = getUUID();
        let conversionIdInHex = web3.utils.asciiToHex(conversionId);
        console.log("conversionId - ", conversionId); 


        // Try to convert the value less than per txn min amount should fail
        let sgn = await signFuns.waitSignedMessageConversionOut(accounts[9], 100, accounts[1], conversionIdInHex, tokenConversionManager.address);
        let vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));
        await expectRevert(
            tokenConversionManager.conversionOut(100, conversionIdInHex, vrs.v, vrs.r, vrs.s, {from:accounts[1]}),
            'Violates conversion limits'
        );

        // Try to convert the value less than per txn max amount should fail
        sgn = await signFuns.waitSignedMessageConversionOut(accounts[9], amount_a1+100, accounts[1], conversionIdInHex, tokenConversionManager.address);
        vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));
        await expectRevert(
            tokenConversionManager.conversionOut(amount_a1+100, conversionIdInHex, vrs.v, vrs.r, vrs.s, {from:accounts[1]}),
            'Violates conversion limits'
        );

        sgn = await signFuns.waitSignedMessageConversionOut(accounts[9], amount_a1, accounts[1], conversionIdInHex, tokenConversionManager.address);
        vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));


        // Try calling the function with different amount the Signature should fail
        await expectRevert(
            tokenConversionManager.conversionOut(amount_a1-10, conversionIdInHex, vrs.v, vrs.r, vrs.s, {from:accounts[1]}),
            'Invalid request or signature'
        );

        await conversionOutAndVerify(amount_a1, accounts[1], conversionIdInHex, vrs.v, vrs.r, vrs.s);


        // Try calling the function with same Signature should fail
        await expectRevert(
            tokenConversionManager.conversionOut(amount_a1, conversionIdInHex, vrs.v, vrs.r, vrs.s, {from:accounts[1]}),
            'Signature has already been used'
        );

    });


    it("5. Conversion from nonEth to Eth network", async function() 
    {

        // Conversion of tokens from Account-1
        let conversionId = getUUID();
        let conversionIdInHex = web3.utils.asciiToHex(conversionId);
        console.log("conversionId - ", conversionId); 

        // Try to convert the value less than per txn min amount should fail
        let sgn = await signFuns.waitSignedMessageConversionOut(accounts[9], 100, accounts[1], conversionIdInHex, tokenConversionManager.address);
        let vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));
        await expectRevert(
            tokenConversionManager.conversionIn(accounts[1], 100, conversionIdInHex, vrs.v, vrs.r, vrs.s, {from:accounts[1]}),
            'Violates conversion limits'
        );

        // Try to convert the value less than per txn max amount should fail
        sgn = await signFuns.waitSignedMessageConversionOut(accounts[9], amount_a1+100, accounts[1], conversionIdInHex, tokenConversionManager.address);
        vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));
        await expectRevert(
            tokenConversionManager.conversionIn(accounts[1], amount_a1+100, conversionIdInHex, vrs.v, vrs.r, vrs.s, {from:accounts[1]}),
            'Violates conversion limits'
        );

        sgn = await signFuns.waitSignedMessageConversionIn(accounts[9], amount_a1, accounts[1], conversionIdInHex, tokenConversionManager.address);
        vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));

        // Try calling the function with different amount the Signature should fail
        await expectRevert(
            tokenConversionManager.conversionIn(accounts[1], amount_a1-10, conversionIdInHex, vrs.v, vrs.r, vrs.s, {from:accounts[1]}),
            'Invalid request or signature'
        );

        await conversionInAndVerify(accounts[1], amount_a1, accounts[1], conversionIdInHex, vrs.v, vrs.r, vrs.s);


        // Try calling the function with same Signature should fail
        await expectRevert(
            tokenConversionManager.conversionIn(accounts[1], amount_a1, conversionIdInHex, vrs.v, vrs.r, vrs.s, {from:accounts[1]}),
            'Signature has already been used'
        );

        // Try to mint more than maxSupply Should fail
        conversionId = getUUID();
        conversionIdInHex = web3.utils.asciiToHex(conversionId);
        const amount_a2 = amount_a1;
        sgn = await signFuns.waitSignedMessageConversionIn(accounts[9], amount_a2, accounts[2], conversionIdInHex, tokenConversionManager.address);
        vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));

        await expectRevert(
            tokenConversionManager.conversionIn(accounts[2], amount_a2, conversionIdInHex, vrs.v, vrs.r, vrs.s, {from:accounts[2]}),
            'Invalid Amount'
        );

    });


});
