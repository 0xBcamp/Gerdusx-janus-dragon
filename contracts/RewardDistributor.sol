// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ERC20TokenFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardDistributor is Ownable {

    event RewardTokenSet(uint256 indexed id, address indexed rewardToken);
    event RewardDistributed(address indexed recipient, address indexed rewardToken, uint256 indexed id, uint256 amount);

    mapping(uint256 => address) public idToRewardToken;

    modifier validRecipient(address recipient) {
        require(recipient != address(0), "Invalid recipient address");
        _;
    }

    modifier hasRewardToken(uint256 _id) {
        require(idToRewardToken[_id] != address(0), "Reward token not set");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Sets the reward token.
     * @param id The id of the reward token
     * @param rewardToken The address of the ERC-20 token to be used as a reward.
     */
    function setRewardToken(uint256 id, address rewardToken) external onlyOwner {
        require(rewardToken != address(0), "Invalid reward token address");
        idToRewardToken[id] = rewardToken;
        emit RewardTokenSet(id, idToRewardToken[id]);
    }

    /**
     * @dev Distributes rewards to the specified recipient.
     * @param id The ID of the reward token (payment service)
     * @param sender The address of the reward sender
     * @param recipient The address to which rewards will be distributed.
     * @param amount The amount of rewards to distribute.
     */
    function distributeRewards(uint256 id, address sender, address recipient, uint256 amount) external onlyOwner validRecipient(recipient) hasRewardToken(id) {
        require(IERC20(idToRewardToken[id]).balanceOf(sender) >= amount, "Insufficient reward balance");
        require(IERC20(idToRewardToken[id]).allowance(sender, address(this)) >= amount, "Sender does not have enough allowance");

        // Transfer rewards to address(this)
        IERC20(idToRewardToken[id]).transferFrom(sender, address(this), amount);

        // Transfer rewards to recipient
        if(IERC20(idToRewardToken[id]).allowance(address(this), recipient) < amount) {
            IERC20(idToRewardToken[id]).approve(recipient, amount);
        }

        IERC20(idToRewardToken[id]).transfer(recipient, amount);

        emit RewardDistributed(recipient, idToRewardToken[id], id, amount);
    }

    /**
     * @dev Sets the new owner of the contract
     * @param newOwner The address of the new owner
     */
    function setOwner(address newOwner) public onlyOwner {
        transferOwnership(newOwner);
    }
}
