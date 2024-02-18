const { waffle, ethers } = require("hardhat");
const { deployContract } = waffle;
const { expect } = require('chai');

describe('PaymentServiceManager', () => {
    let rewardDistributor;
    let tokenFactory;
    let paymentServiceManager;
    let owner;
    let payerOrRewardRecipient;

    beforeEach(async () => {
        [owner, payerOrRewardRecipient] = await ethers.getSigners();
        const ERC20TokenFactory = await ethers.getContractFactory("ERC20TokenFactory");
        tokenFactory = await ERC20TokenFactory.deploy();
        await tokenFactory.deployed();

        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        rewardDistributor = await RewardDistributor.deploy();
        await rewardDistributor.deployed();

        const PaymentServiceManager = await ethers.getContractFactory("PaymentServiceManager");
        paymentServiceManager = await PaymentServiceManager.deploy(rewardDistributor.address);
        await paymentServiceManager.deployed();

        await rewardDistributor.setOwner(paymentServiceManager.address);
    });

    it('should create a new payment service and set the reward token', async () => {
        const tx = await tokenFactory.deployToken("Token1", "TK1", 1000000);
        const receipt = await tx.wait();

        const rewardToken = await ethers.getContractAt("ERC20Token", receipt.events[2].args.tokenAddress);

        const serviceId = await paymentServiceManager.callStatic.createPaymentService(rewardToken.address);


        await paymentServiceManager.createPaymentService(rewardToken.address);

        const nextServiceId = await paymentServiceManager.nextId();

        expect(nextServiceId).to.equal(2);
        expect(serviceId).to.equal(1);

        const ownerOfService = await paymentServiceManager.idToOwner(serviceId);
        expect(ownerOfService).to.equal(owner.address);

        const walletServiceIds = await paymentServiceManager.walletToServiceIds(owner.address, 0);
        expect(walletServiceIds).to.deep.equal(serviceId);
    });

    it('should create a new payment service and set reward parameters', async () => {
        const tx = await tokenFactory.deployToken("Token1", "TK1", 1000000);
        const receipt = await tx.wait();

        const rewardToken = await ethers.getContractAt("ERC20Token", receipt.events[2].args.tokenAddress);

        tx2 = await tokenFactory.deployToken("PaymentToken", "PT", 1000000);
        const receipt2 = await tx2.wait();

        const paymentToken = await ethers.getContractAt("ERC20Token", receipt2.events[2].args.tokenAddress);

        await paymentServiceManager.createPaymentService(rewardToken.address);

        await expect(paymentServiceManager.setRewardParams(1, paymentToken.address, 2, rewardToken.address))
            .to.emit(paymentServiceManager, 'RewardParamsSet')
            .withArgs(1, paymentToken.address, 2);

        const params = await paymentServiceManager.rewardParamsById(1);
        expect(params.paymentToken).to.equal(paymentToken.address);
        expect(params.rewardMultiplier).to.equal(2);

        const rewardDistributorToken = await rewardDistributor.idToRewardToken(1);
        expect(rewardDistributorToken).to.equal(rewardToken.address);
    });

    it('should pay and distribute rewards correctly', async () => {
        const tx = await tokenFactory.deployToken("Token1", "TK1", 1000000);
        const receipt = await tx.wait();

        const rewardToken = await ethers.getContractAt("ERC20Token", receipt.events[2].args.tokenAddress);

        tx2 = await tokenFactory.deployToken("PaymentToken", "PT", 1000000);
        const receipt2 = await tx2.wait();

        const paymentToken = await ethers.getContractAt("ERC20Token", receipt2.events[2].args.tokenAddress);

        
        const amount = 100000;
        const infinity = ethers.constants.MaxUint256;
        
        // Send some payment tokens to payerOrRewardRecipient
        await paymentToken.connect(owner).approve(payerOrRewardRecipient.address, amount);
        await paymentToken.connect(owner).transfer(payerOrRewardRecipient.address, amount);
        
        await paymentServiceManager.createPaymentService(rewardToken.address);
        await paymentServiceManager.setRewardParams(1, paymentToken.address, 2, rewardToken.address);
        
        // Approve allowance
        await paymentToken.connect(payerOrRewardRecipient).approve(owner.address, amount);
        await paymentToken.connect(payerOrRewardRecipient).approve(paymentServiceManager.address, amount);
        await rewardToken.connect(owner).approve(rewardDistributor.address, infinity);
        
        const ownerBalanceBefore = await paymentToken.balanceOf(owner.address);

        await expect(paymentServiceManager.connect(payerOrRewardRecipient).pay(1, amount))
        .to.emit(paymentServiceManager, 'PaymentReceived')
        .withArgs(payerOrRewardRecipient.address, amount, paymentToken.address, 1);

        // Check fee transfer
        const feeAmount = (amount * 5) / 10000; // 0.05% fee
        const ownerBalance = await paymentToken.balanceOf(owner.address);
        const expectedOwnerBalance = BigInt(ownerBalanceBefore) + BigInt(amount) - BigInt(feeAmount);
        expect(String(ownerBalance)).to.equal(expectedOwnerBalance.toString());

        // Check reward distribution
        const rewardDistributed = await rewardToken.balanceOf(payerOrRewardRecipient.address);
        expect(rewardDistributed).to.equal(amount * 2);
    });

    it('should transfer ownership of the payment service', async () => {
        const tx = await tokenFactory.deployToken("Token1", "TK1", 1000000);
        const receipt = await tx.wait();

        const rewardToken = await ethers.getContractAt("ERC20Token", receipt.events[2].args.tokenAddress);

        const serviceId = await paymentServiceManager.nextId();

        await paymentServiceManager.connect(await owner).createPaymentService(rewardToken.address);

        await paymentServiceManager.connect(await owner).transferServiceOwnership(await serviceId, await payerOrRewardRecipient.address);

        const newOwner = await paymentServiceManager.owner();

        expect(await newOwner).to.equal(payerOrRewardRecipient.address);

        const oldOwnerServiceIds = await paymentServiceManager.walletToServiceIds(await owner.address, String(0));
        expect(await oldOwnerServiceIds).to.deep.equal(null);

        console.log('b0');

        const newOwnerServiceIds = await paymentServiceManager.walletToServiceIds(await payerOrRewardRecipient.address);
        expect(await newOwnerServiceIds[0]).to.deep.equal(serviceId);
    });

    it('should withdraw fees correctly', async () => {
        const tx = await tokenFactory.deployToken("Token1", "TK1", 1000000);
        const receipt = await tx.wait();

        const rewardToken = await ethers.getContractAt("ERC20Token", receipt.events[2].args.tokenAddress);

        tx2 = await tokenFactory.deployToken("PaymentToken", "PT", 100);
        const receipt2 = await tx2.wait();

        const paymentToken = await ethers.getContractAt("ERC20Token", receipt2.events[2].args.tokenAddress);

        const serviceId = await paymentServiceManager.nextId();

        await paymentServiceManager.connect(await owner).createPaymentService(rewardToken.address);

        await paymentServiceManager.connect(await owner).setRewardParams(serviceId, paymentToken.address, 2, rewardToken.address);

        await paymentToken.connect(await owner).transfer(await paymentServiceManager.address, 100);

        await paymentServiceManager.connect(await owner).withdrawFees(serviceId);

        const ownerBalance = await paymentToken.balanceOf(owner.address);
        expect(String(ownerBalance)).to.equal(String(100000000000000000000));
    });
});
