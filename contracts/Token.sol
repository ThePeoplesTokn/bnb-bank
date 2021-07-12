// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Implements a mintable Token 
 */
contract Token is ERC20 {

    address public minter;

    event MinterChanged(address indexed account);
    

    /**
     * @dev Create the token and assign a minter
     */ 
    constructor() payable ERC20("TEST", "TEST") {
        // Initial minter is the address that deploys the contract
        minter = msg.sender;
    }


    /**
     * @dev Change the minter address, restricted to the minter
     */ 
    function changeMinter(address new_minter_) public {
        require(msg.sender == minter, 'Method is restricted to minter');
        minter = new_minter_;
        emit MinterChanged(new_minter_);
    }


    /**
     * @dev Mint tokens and send to an address
     */ 
    function mint(address account, uint256 amount) public {
        //check if msg.sender have minter role
        require(msg.sender == minter, 'Method is restricted to minter');
        _mint(account, amount);
    }
}
