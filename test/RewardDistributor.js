const { waffle, ethers } = require("hardhat");
const { deployContract } = waffle;
const { expect } = require('chai');

describe('RewardDistributor', () => {
    let rewardDistributor;
    let tokenFactory;
    let owner;
    let recipient;

    beforeEach(async () => {
        [owner, recipient] = await ethers.getSigners();
        const ERC20TokenFactory = await ethers.getContractFactory("ERC20TokenFactory");
        tokenFactory = await ERC20TokenFactory.deploy();
        await tokenFactory.deployed();

        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        rewardDistributor = await RewardDistributor.deploy();
        await rewardDistributor.deployed();
    });

    it('should set reward token', async () => {
        const tx = await tokenFactory.deployToken("Token1", "TK1", 1000000);
        const receipt = await tx.wait();

        const rewardToken = await ethers.getContractAt("ERC20Token", receipt.events[2].args.tokenAddress);

        // Test that only the owner can set the reward token
        await expect(rewardDistributor.connect(recipient).setRewardToken(1, rewardToken.address)).to.be.reverted;

        // Set reward token by the owner
        await expect(rewardDistributor.connect(owner).setRewardToken(1, rewardToken.address))
            .to.emit(rewardDistributor, 'RewardTokenSet')
            .withArgs(1, rewardToken.address);

        // Check if the mapping is updated
        expect(await rewardDistributor.idToRewardToken(1)).to.equal(rewardToken.address);
    });

    it('should distribute rewards', async () => {
        const tx = await tokenFactory.deployToken("Token1", "TK1", 1000000);
        const receipt = await tx.wait();

        const rewardToken = await ethers.getContractAt("ERC20Token", receipt.events[2].args.tokenAddress);

        await rewardDistributor.setRewardToken(1, rewardToken.address);

        // Test that only the owner can distribute rewards
        await expect(rewardDistributor.connect(recipient).distributeRewards(1, owner.address, recipient.address, 100)).to.be.reverted;

        // Approve some reward tokens to the contract
        await rewardToken.approve(rewardDistributor.address, 1000);

        // Distribute rewards by the owner
        await expect(rewardDistributor.distributeRewards(1, owner.address, recipient.address, 100))
            .to.emit(rewardDistributor, 'RewardDistributed')
            .withArgs(recipient.address, rewardToken.address, 1, 100);

        // Check if the rewards were transferred correctly
        expect(await rewardToken.balanceOf(recipient.address)).to.equal(100);
    });
});
