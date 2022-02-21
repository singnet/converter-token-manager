pragma solidity >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenConversionManager is Ownable, ReentrancyGuard {

    using SafeMath for uint256;

    ERC20Burnable public token; // Address of token contract
    address public conversionAuthorizer; // Authorizer Address for the conversion 

    //already used conversion signature from authorizer in order to prevent replay attack
    mapping (bytes32 => bool) public usedSignatures; 


    // Events
    event NewAuthorizer(address conversionAuthorizer);
    event LockToken(address indexed tokenHolder, uint256 lockAmount);
    event UnLock(address indexed tokenHolder, uint256 unlockAmount, bytes sourceAddress);

    event ConversionOut(address indexed tokenHolder, bytes32 conversionId, uint256 amount);
    event ConversionIn(address indexed tokenHolder, bytes32 conversionId, uint256 amount);

    constructor(address _token)
    public
    {
        token = ERC20Burnable(_token);
        conversionAuthorizer = msg.sender;
    }

    function updateAuthorizer(address newAuthorizer) public onlyOwner {

        require(newAuthorizer != address(0), "Invalid operator address");
        conversionAuthorizer = newAuthorizer;

        emit NewAuthorizer(newAuthorizer);
    }


    function conversionOut(uint256 amount, bytes32 conversionId, uint8 v, bytes32 r, bytes32 s) external nonReentrant {

        // Check for the Balance
        require(token.balanceOf(msg.sender) >= amount, "Not enough balance");
        
        //compose the message which was signed
        bytes32 message = prefixed(keccak256(abi.encodePacked("__conversionOut", amount, msg.sender, conversionId, this)));

        // check that the signature is from the authorizer
        address signAddress = ecrecover(message, v, r, s);
        require(signAddress == conversionAuthorizer, "Invalid request or signature");

        //check for replay attack (message signature can be used only once)
        require( ! usedSignatures[message], "Signature has already been used");
        usedSignatures[message] = true;

        // Burn the tokens on behalf of the Wallet
        token.burnFrom(msg.sender, amount);

        emit ConversionOut(msg.sender, conversionId, amount);

    }


    function conversionIn(address to, uint256 amount, bytes32 conversionId, uint8 v, bytes32 r, bytes32 s) external nonReentrant {
       
       require(to != address(0), "Invalid wallet");

        //compose the message which was signed
        bytes32 message = prefixed(keccak256(abi.encodePacked("__conversionIn", amount, msg.sender, conversionId, this)));

        // check that the signature is from the authorizer
        address signAddress = ecrecover(message, v, r, s);
        require(signAddress == conversionAuthorizer, "Invalid request or signature");

        //check for replay attack (message signature can be used only once)
        require( ! usedSignatures[message], "Signature has already been used");
        usedSignatures[message] = true;

        // TODO - Add conditions to safe gaurd any attacks


        // Mint the tokens and transfer to the User Wallet using the Call function
        // token.mint(amount, msg.sender);

        (bool success, ) = address(token).call(abi.encodeWithSignature("mint(address,uint256)", to, amount));

        // In case if the mint call fails
        require(success, "ConversionIn Failed");

        emit ConversionIn(msg.sender, conversionId, amount);

    }





    function lockTokens(uint256 amount) external nonReentrant {

        // Transfer the Tokens to Contract
        require(token.transferFrom(msg.sender, address(this), amount), "Unable to transfer token to the contract");

        emit LockToken(msg.sender, amount);

    }

    function unLockTokens(uint256 amount, uint256 blockNumber, bytes calldata sourceAddress,uint8 v, bytes32 r, bytes32 s) external nonReentrant {

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