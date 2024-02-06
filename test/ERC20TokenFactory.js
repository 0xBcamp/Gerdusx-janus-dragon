const { waffle, ethers } = require("hardhat");
const { deployContract } = waffle;
const { expect } = require('chai');

describe('ERC20TokenFactory', function () {
  let owner;
  let ERC20TokenFactory;
  let erc20TokenFactory;
  let ERC20Token;
  let erc20Token;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // Deploy ERC20TokenFactory contract
    ERC20TokenFactory = await ethers.getContractFactory('ERC20TokenFactory');
    erc20TokenFactory = await ERC20TokenFactory.deploy();

    // Deploy ERC20Token contract through ERC20TokenFactory
    ERC20Token = await ethers.getContractFactory('ERC20Token');
  });

  it('should deploy ERC20TokenFactory and create a new token with custom values', async function () {
    const name = 'Test Token';
    const symbol = 'TST';
    const initialSupply = 1000;

    // Deploy a new token using ERC20TokenFactory
    const tx = await erc20TokenFactory.deployToken(name, symbol, initialSupply);
    const receipt = await tx.wait();
    const tokenAddress = receipt.events[2].args.tokenAddress;

    erc20Token = ERC20Token.attach(tokenAddress);

    // Check ERC20Token details
    expect(await erc20Token.name()).to.equal(name);
    expect(await erc20Token.symbol()).to.equal(symbol);
    expect(await erc20Token.decimals()).to.equal(18);
    expect(await erc20Token.balanceOf(owner.address) / (10**18)).to.equal(initialSupply);
  });

  it('should deploy ERC20TokenFactory and create a new token with default values', async function () {
    const name = 'Default Token';
    const symbol = 'DTT';

    // Deploy a new token using ERC20TokenFactory with default values
    const tx = await erc20TokenFactory.deployTokenDefault(name, symbol);
    const receipt = await tx.wait();
    const tokenAddress = receipt.events[2].args.tokenAddress;

    erc20Token = ERC20Token.attach(tokenAddress);
    
    // Check ERC20Token details with default values
    expect(await erc20Token.name()).to.equal(name);
    expect(await erc20Token.symbol()).to.equal(symbol);
    expect(await erc20Token.decimals()).to.equal(18);
    expect(await erc20Token.balanceOf(owner.address)).to.equal(0);
  });
});

