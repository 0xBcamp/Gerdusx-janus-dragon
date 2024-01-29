// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract ERC20TokenFactory is Ownable {

    event TokenDeployed(address indexed tokenAddress, string name, string symbol, uint8 decimals, uint256 initialSupply);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deploys a new ERC-20 token contract with provided parameters.
     * @param name The name of the token.
     * @param symbol The symbol of the token.
     * @param decimals The number of decimals for the token.
     * @param initialSupply The initial supply of the token.
     * @return The address of the deployed ERC-20 token contract.
     */
    function deployToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply
    ) external onlyOwner returns (address) {
        ERC20Token newToken = new ERC20Token(name, symbol, decimals, initialSupply);
        emit TokenDeployed(address(newToken), name, symbol, decimals, initialSupply);
        return address(newToken);
    }

    /**
     * @dev Deploys a new ERC-20 token contract with hardcoded default values.
     * @param name The name of the token.
     * @param symbol The symbol of the token.
     * @return The address of the deployed ERC-20 token contract.
     */
    function deployTokenDefault(string memory name, string memory symbol) external onlyOwner returns (address) {
        ERC20Token newToken = new ERC20Token(name, symbol, 18, 0);
        emit TokenDeployed(address(newToken), name, symbol, 18, 0);
        return address(newToken);
    }
}

contract ERC20Token is ERC20, Ownable {

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * (10**decimals));
    }
}
