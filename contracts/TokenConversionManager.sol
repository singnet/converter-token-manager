pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenConversionManager is Ownable, ReentrancyGuard {

    using SafeMath for uint256;

    ERC20Burnable public token; // Address of token contract

    address public conversionAuthorizer; // Authorizer Address for the conversion 
    address public feeReceiver; // Wallet address to receive the fee from the conversion

    //already used conversion signature from authorizer in order to prevent replay attack
    mapping (bytes32 => bool) public usedSignatures; 

    // Conversion Configurations
    uint256 public perTxnMinAmount;
    uint256 public perTxnMaxAmount;
    uint256 public maxSupply;

    // The fee percentage will be multiplied by 100 and passed during the configurations.
    uint256 public feePercentage; 

    // Method Declaration
    bytes4 private constant MINT_SELECTOR = bytes4(keccak256("mint(address,uint256)"));

    // Events
    event NewAuthorizer(address conversionAuthorizer);
    event NewFeeReceiver(address newFeeReceiver);
    event UpdateConfiguration(uint256 _feePercentage, uint256 perTxnMinAmount, uint256 perTxnMaxAmount, uint256 maxSupply);

    event ConversionOut(address indexed tokenHolder, bytes32 conversionId, uint256 amount);
    event ConversionIn(address indexed tokenHolder, bytes32 conversionId, uint256 amount);


    // Modifiers
    modifier checkLimits(uint256 amount) {

        // Check for min, max per transaction limits
        require(amount >= perTxnMinAmount && amount <= perTxnMaxAmount, "Violates conversion limits");
        _;

    }

    constructor(address _token)
    public
    {
        token = ERC20Burnable(_token);
        conversionAuthorizer = msg.sender;
        feeReceiver = msg.sender;
    }

    /**
    * @dev To update the authorizer who can authorize the conversions.
    */
    function updateAuthorizer(address newAuthorizer) external onlyOwner {

        require(newAuthorizer != address(0), "Invalid operator address");
        conversionAuthorizer = newAuthorizer;

        emit NewAuthorizer(newAuthorizer);
    }

    /**
    * @dev To update the fee receiver wallet address.
    */
    function updateFeeReceiver(address newFeeReceiver) external onlyOwner {

        require(newFeeReceiver != address(0), "Invalid wallet address");
        feeReceiver = newFeeReceiver;

        emit NewFeeReceiver(newFeeReceiver);
    }

    /**
    * @dev To update the per transaction limits for the conversion and to provide max total supply 
    */
    function updateConfigurations(
        uint256 _feePercentage, 
        uint256 _perTxnMinAmount, 
        uint256 _perTxnMaxAmount, 
        uint256 _maxSupply
        ) external onlyOwner {

        // Check for the valid inputs
        require(_perTxnMinAmount > 0 && _perTxnMaxAmount > _perTxnMinAmount && _maxSupply > 0, "Invalid inputs");
        require(_feePercentage >= 0 && _feePercentage <= 10000 , "Invalid Fee Percentage");


        // Update the configurations
        feePercentage = _feePercentage;
        perTxnMinAmount = _perTxnMinAmount;
        perTxnMaxAmount = _perTxnMaxAmount;
        maxSupply = _maxSupply;
        
        emit UpdateConfiguration(_feePercentage, _perTxnMinAmount, _perTxnMaxAmount, _maxSupply);

    }


    /**
    * @dev To convert the tokens from Ethereum to non Ethereum network. 
    * The tokens which needs to be convereted will be burned on the host network.
    * The conversion authorizer needs to provide the signature to call this function.
    */
    function conversionOut(uint256 amount, bytes32 conversionId, uint8 v, bytes32 r, bytes32 s) external checkLimits(amount) nonReentrant {

        // Check for non zero value for the amount is not needed as the Signature will not be generated for zero amount

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

    /**
    * @dev To convert the tokens from non Ethereum to Ethereum network. 
    * The tokens which needs to be convereted will be minted on the host network.
    * The conversion authorizer needs to provide the signature to call this function.
    */
    function conversionIn(address to, uint256 amount, bytes32 conversionId, uint8 v, bytes32 r, bytes32 s) external checkLimits(amount) nonReentrant {
       
        // Check for the valid destimation wallet
        require(to != address(0), "Invalid wallet");

        // Check for non zero value for the amount is not needed as the Signature will not be generated for zero amount

        //compose the message which was signed
        bytes32 message = prefixed(keccak256(abi.encodePacked("__conversionIn", amount, msg.sender, conversionId, this)));

        // check that the signature is from the authorizer
        address signAddress = ecrecover(message, v, r, s);
        require(signAddress == conversionAuthorizer, "Invalid request or signature");

        //check for replay attack (message signature can be used only once)
        require( ! usedSignatures[message], "Signature has already been used");
        usedSignatures[message] = true;

        // Check for the supply
        require(token.totalSupply().add(amount) <= maxSupply, "Invalid Amount");

        // Mint the tokens and transfer to the User Wallet using the Call function
        // token.mint(amount, msg.sender);

        // Compute the Fee - The fee amount will be subtracted during the transfer
        uint256 feeAmount = amount.mul(feePercentage).div(10000);

        (bool success, ) = address(token).call(abi.encodeWithSelector(MINT_SELECTOR, address(this), amount));

        // In case if the mint call fails
        require(success, "ConversionIn Failed");

        // Do the transfers
        require(token.transfer(to, amount.sub(feeAmount)), "Unable to transfer token");
        if(feeAmount > 0) {
            require(token.transfer(feeReceiver, feeAmount), "Unable to transfer token");
        }

        emit ConversionIn(msg.sender, conversionId, amount);

    }

    /// builds a prefixed hash to mimic the behavior of ethSign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) 
    {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

}