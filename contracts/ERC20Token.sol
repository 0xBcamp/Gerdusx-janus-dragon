// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract ERC20Token is ERC20, Ownable {

    constructor(
        address owner,
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(owner) {
        _mint(owner, initialSupply * (10**decimals()));
    }

    function mint(uint256 amount) public onlyOwner {
        _mint(owner(), amount * (10**decimals()));
    }
}