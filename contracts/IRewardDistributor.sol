// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRewardDistributor {
    event RewardTokenSet(address indexed rewardToken);
    event RewardDistributed(address indexed recipient, uint256 amount);

    function setRewardToken(uint256 id, address _rewardToken) external;
    function distributeRewards(uint256 id, address sender, address recipient, uint256 amount) external;

    // View functions
    function rewardToken() external view returns (address);
    function erc20TokenContract() external view returns (address);
    function owner() external view returns (address);
}
