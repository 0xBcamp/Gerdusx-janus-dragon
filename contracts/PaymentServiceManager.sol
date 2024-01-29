// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PaymentServiceManager is Ownable {

    event PaymentReceived(address indexed payer, uint256 amount, address paymentToken, uint256 serviceId);
    event RewardParamsSet(uint256 indexed id, address paymentToken, uint256 rewardMultiplier);

    struct RewardParams {
        address paymentToken;
        uint256 rewardMultiplier;
    }

    mapping(uint256 => RewardParams) public rewardParamsById;
    mapping(address => uint256[]) public walletToServiceIds; // Updated mapping
    mapping(uint256 => address) public idToOwner;

    uint256 public nextId = 1;
    uint256 public feePercentage = 10; // 0.1%

    address public rewardDistributorContract;

    modifier onlyPaymentServiceOwner(uint256 id) {
        require(owner() == idToOwner[id], "Not the owner of this Payment Service");
        _;
    }

    modifier validPaymentToken(address paymentToken) {
        require(paymentToken != address(0), "Invalid payment token address");
        _;
    }

    modifier validRewardMultiplier(uint256 rewardMultiplier) {
        require(rewardMultiplier > 0, "Reward multiplier must be greater than zero");
        _;
    }

    modifier validFeePercentage(uint256 newFeePercentage) {
        require(newFeePercentage <= 100, "Fee percentage must be 100 or less");
        require(newFeePercentage >= 0, "Fee percentage must be 0 or more");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Registers a new payment service and sets the function caller address as the owner of the payment service 
     */
    function createPaymentService() external {
        uint256 newId = nextId;
        idToOwner[newId] = msg.sender;
        walletToServiceIds[msg.sender].push(newId); // Update the mapping
        nextId++;
    }

    /**
     * @dev Send the specified amount of payment token to the owner of the payment service by id
     * @param id The ID of the payment service 
     * @param amount The Amount of payment token wanted to be sent to the owner of the payment service
     */
    function pay(uint256 id, uint256 amount) external {
        require(idToOwner[id] != address(0), "Invalid Payment Service ID");
        RewardParams memory params = rewardParamsById[id];
        address paymentToken = params.paymentToken;
        require(IERC20(paymentToken).transferFrom(msg.sender, address(this), amount), "Payment transfer failed");

        // Calculate and deduct fee
        uint256 feeAmount = (amount * feePercentage) / 100;
        uint256 finalAmount = amount - feeAmount;

        // Transfer payment (minus fee) to the Payment Service owner
        IERC20(paymentToken).transfer(owner(), finalAmount);

        // Emit event for payment received
        emit PaymentReceived(msg.sender, amount, paymentToken, id);

        // Distribute rewards based on the configuration
        
    }

    /**
     * @dev Allows to set the Reward Distributor configuration from the owner of the payment service
     * @param id The ID of the payment service
     * @param paymentToken The new Payment Token address
     * @param rewardMultiplier The amount of Reward tokens distibuted per payment token paid
     */
    function setRewardParams(uint256 id, address paymentToken, uint256 rewardMultiplier) external onlyPaymentServiceOwner(id) validPaymentToken(paymentToken) validRewardMultiplier(rewardMultiplier) {
        rewardParamsById[id] = RewardParams(paymentToken, rewardMultiplier);
        emit RewardParamsSet(id, paymentToken, rewardMultiplier);
    }

    /**
     * @dev Set the fee percentage that goes to the owner of the contract from each payment
     * @param newFeePercentage The fee percentage for each payment 
     */
    function setFeePercentage(uint256 newFeePercentage) external onlyOwner validFeePercentage(newFeePercentage) {
        feePercentage = newFeePercentage;
    }

    /**
     * @dev Transfers the ownership of the payment service
     * @param id The ID of the payment service
     * @param newOwner The address of the new owner of the payment service
     */
    function transferOwnership(uint256 id, address newOwner) external onlyPaymentServiceOwner(id) {
        require(newOwner != address(0), "Invalid new owner address");
        address currentOwner = owner();
        transferOwnership(newOwner);
        
        // Remove the current service ID from the old owner's array
        uint256[] storage serviceIds = walletToServiceIds[currentOwner];
        for (uint256 i = 0; i < serviceIds.length; i++) {
            if (serviceIds[i] == id) {
                serviceIds[i] = serviceIds[serviceIds.length - 1];
                serviceIds.pop();
                break;
            }
        }

        // Add the service ID to the new owner's array
        walletToServiceIds[newOwner].push(id);

        idToOwner[id] = newOwner;
        emit OwnershipTransferred(currentOwner, newOwner);
    }
}
