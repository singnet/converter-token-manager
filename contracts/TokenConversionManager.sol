pragma solidity >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenConversionManager is Ownable {

    using SafeMath for uint256;

    ERC20 public token; // Address of token contract
    address public conversionAuthorizer; // Authorizer Address for the conversion 

    //already used conversion signature from authorizer in order to prevent replay attack
    mapping (bytes32 => bool) public usedSignatures; 


    // Events
    event NewAuthorizer(address conversionAuthorizer);
    event LockToken(address indexed tokenHolder, uint256 lockAmount);
    event UnLock(address indexed tokenHolder, uint256 unlockAmount, bytes sourceAddress);

    constructor(address _token)
    public
    {
        token = ERC20(_token);
        conversionAuthorizer = msg.sender;
    }

    function updateAuthorizer(address newAuthorizer) public onlyOwner {

        require(newAuthorizer != address(0), "Invalid operator address");
        conversionAuthorizer = newAuthorizer;

        emit NewAuthorizer(newAuthorizer);
    }


    function lockTokens(uint256 amount) public {

        // Transfer the Tokens to Contract
        require(token.transferFrom(msg.sender, address(this), amount), "Unable to transfer token to the contract");

        emit LockToken(msg.sender, amount);

    }

    function unLockTokens(uint256 amount, uint256 blockNumber, bytes memory sourceAddress,uint8 v, bytes32 r, bytes32 s) public {

        // Check if contract is having required balance 
        require(token.balanceOf(address(this)) >= amount, "Not enough balance in the contract");

        //compose the message which was signed
        bytes32 message = prefixed(keccak256(abi.encodePacked("__conversion", amount, msg.sender, blockNumber, this, sourceAddress)));
        // check that the signature is from the authorizer
        address signAddress = ecrecover(message, v, r, s);
        require(signAddress == conversionAuthorizer, "Invalid request or signature");

        //check for replay attack (message signature can be used only once)
        require( ! usedSignatures[message], "Signature has already been used");
        usedSignatures[message] = true;

        // Return to User Wallet
        require(token.transfer(msg.sender, amount), "Unable to transfer token to the account");

        emit UnLock(msg.sender, amount, sourceAddress);

    }

    /// builds a prefixed hash to mimic the behavior of ethSign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) 
    {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

}