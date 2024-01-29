// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ERC20TokenFactory.sol";

contract RewardDistributor is Ownable {

    event RewardTokenSet(address indexed rewardToken);
    event RewardDistributed(address indexed recipient, uint256 amount);

    address public rewardToken;
    ERC20Token public erc20TokenContract;

    modifier validRecipient(address recipient) {
        require(recipient != address(0), "Invalid recipient address");
        _;
    }

    modifier hasRewardToken() {
        require(rewardToken != address(0), "Reward token not set");
        _;
    }

    constructor(address _rewardTokenAddress) {
        require(_rewardTokenAddress != address(0), "Reward token address cannot be zero");
        rewardToken = _rewardTokenAddress;
    }

    /**
     * @dev Sets the reward token.
     * @param _rewardToken The address of the ERC-20 token to be used as a reward.
     */
    function setRewardToken(address _rewardToken) external onlyOwner {
        require(_rewardToken != address(0), "Invalid reward token address");
        rewardToken = _rewardToken;
        emit RewardTokenSet(_rewardToken);
    }

    /**
     * @dev Distributes rewards to the specified recipient.
     * @param recipient The address to which rewards will be distributed.
     * @param amount The amount of rewards to distribute.
     */
    function distributeRewards(address recipient, uint256 amount) external onlyOwner validRecipient(recipient) hasRewardToken {
        require(IERC20(rewardToken).balanceOf(address(this)) >= amount, "Insufficient reward balance");

        // Transfer rewards to the recipient
        IERC20(rewardToken).transfer(recipient, amount);
        emit RewardDistributed(recipient, amount);
    }

    /**
     * @dev Distributes rewards in the form of the ERC-20 token associated with the ERC20Token contract.
     * @param recipient The address to which rewards will be distributed.
     * @param amount The amount of rewards to distribute.
     */
    function distributeRewardsFromERC20TokenContract(address recipient, uint256 amount) external onlyOwner validRecipient(recipient) hasRewardToken {
        require(erc20TokenContract.balanceOf(address(this)) >= amount, "Insufficient reward balance");

        // Transfer rewards to the recipient
        erc20TokenContract.transfer(recipient, amount);
        emit RewardDistributed(recipient, amount);
    }
}
