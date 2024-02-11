// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IRewardDistributor.sol";

contract PaymentServiceManager is Ownable {

    event PaymentReceived(address indexed payer, uint256 amount, address paymentToken, uint256 serviceId);
    event RewardParamsSet(uint256 indexed id, address paymentToken, uint256 rewardMultiplier);
    event newFeePercentageSet(uint256 newFeePercentage);

    struct RewardParams {
        address paymentToken;
        uint256 rewardMultiplier;
    }

    mapping(uint256 => RewardParams) public rewardParamsById;
    mapping(address => uint256[]) public walletToServiceIds; // Updated mapping
    mapping(uint256 => address) public idToOwner;

    uint256 public nextId = 1;
    uint256 public feePercentage = 5; // 0.05%

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

    modifier isOwnerOf(address contractAddress) {
        require(IRewardDistributor(contractAddress).owner() == address(this), "This contract does not own a RewardDistibutor contract");
        _;
    }

    constructor(address _rewardDistributorContract) Ownable(msg.sender) {
        require(_rewardDistributorContract != address(0), "Null address for reward distributor contract is not acceptable");
        rewardDistributorContract = _rewardDistributorContract;
    }

    /**
     * @dev Registers a new payment service and sets the function caller address as the owner of the payment service 
     */
    function createPaymentService(address rewardToken) external isOwnerOf(rewardDistributorContract) returns (uint256 newId) {
        newId = nextId;
        idToOwner[newId] = msg.sender;
        walletToServiceIds[msg.sender].push(newId); // Update the mapping
        nextId++;
        IRewardDistributor(rewardDistributorContract).setRewardToken(newId, rewardToken);
    }

    /**
     * @dev Send the specified amount of payment token to the owner of the payment service by id
     * @param id The ID of the payment service 
     * @param amount The Amount of payment token wanted to be sent to the owner of the payment service
     */
    function pay(uint256 id, uint256 amount) external isOwnerOf(rewardDistributorContract) {
        require(idToOwner[id] != address(0), "Invalid Payment Service ID");
        RewardParams memory params = rewardParamsById[id];
        address paymentToken = params.paymentToken;

        // Calculate and deduct fee
        uint256 feeAmount = (amount * feePercentage) / 10000;
        uint256 finalAmount = amount - feeAmount;

        require(IERC20(paymentToken).allowance(msg.sender, idToOwner[id]) >= amount, "Address does not have enough allowance");
        require(IERC20(paymentToken).allowance(msg.sender, address(this)) >= feeAmount, "Address does not have enough allowance");

        // Transfer payment (minus fee) to the Payment Service owner
        bool success = IERC20(paymentToken).transferFrom(msg.sender, idToOwner[id], finalAmount);

        if (!success) revert();

        // Transfer fee to address(this)
        success = IERC20(paymentToken).transferFrom(msg.sender, address(this), feeAmount);

        if (!success) revert();

        // Emit event for payment received
        emit PaymentReceived(msg.sender, amount, paymentToken, id);

        // Distribute rewards based on the configuration
        IRewardDistributor(rewardDistributorContract).distributeRewards(id, idToOwner[id], msg.sender, amount * rewardParamsById[id].rewardMultiplier);
    }

    /**
     * @dev Allows to set the Reward Distributor configuration from the owner of the payment service
     * @param id The ID of the payment service
     * @param paymentToken The new Payment Token address
     * @param rewardMultiplier The amount of Reward tokens distibuted per payment token paid
     */
    function setRewardParams(uint256 id, address paymentToken, uint256 rewardMultiplier, address rewardToken) external onlyPaymentServiceOwner(id) validPaymentToken(paymentToken) validRewardMultiplier(rewardMultiplier) isOwnerOf(rewardDistributorContract) {
        rewardParamsById[id] = RewardParams(paymentToken, rewardMultiplier);
        IRewardDistributor(rewardDistributorContract).setRewardToken(id, rewardToken);
        emit RewardParamsSet(id, paymentToken, rewardMultiplier);
    }

    /**
     * @dev Set the fee percentage that goes to the owner of the contract from each payment
     * @param newFeePercentage The fee percentage for each payment 
     */
    function setFeePercentage(uint256 newFeePercentage) external onlyOwner validFeePercentage(newFeePercentage) {
        feePercentage = newFeePercentage;
        emit newFeePercentageSet(newFeePercentage);
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

    function withdrawFees(uint256 id) external onlyOwner {
        require(idToOwner[id] != address(0), "Payment service is not set");

        address paymentToken = rewardParamsById[id].paymentToken;
        require(paymentToken != address(0), "Payment token does not exist");

        if(IERC20(paymentToken).allowance(address(this), owner()) < IERC20(paymentToken).balanceOf(address(this))) {
            IERC20(paymentToken).approve(owner(), IERC20(paymentToken).balanceOf(address(this)));
        }

        bool success = IERC20(paymentToken).transfer(owner(), IERC20(paymentToken).balanceOf(address(this)));

        if (!success) revert();
    }
}
