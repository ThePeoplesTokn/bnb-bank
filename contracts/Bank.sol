// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;

import './Token.sol';

/**
 * @dev Implements the BNB-Bank
 * Allows user to deposit and withdraw funds
 */
contract Bank {

    address public owner;
    mapping(address => uint256) private accounts;
    Token token;
    
    event LogDeposit(address indexed account, uint256 amount);

    /**
     * @dev Create the Bank contract, assumes a Token contract has been deployed already.
     * Requires manually changing the minter of the Token to the owner of the Bank contract.
     * *An alternative would be to instantiate the Token here, so the the bank is minter
     */
    constructor (address token_address_) {
        owner = msg.sender;
        token = Token(token_address_);
    }

    /**
     * @dev Deposit funds in the bank.
     * A check for adequate user funds in MetaMask will be conducted client side.
     */
    function deposit() public payable returns(uint256) {
        
        accounts[msg.sender] += msg.value;  // returns 0 if key is not in mapping 
        emit LogDeposit(msg.sender, msg.value);      
        return accounts[msg.sender];
    }


    /**
     * @dev Withdraw funds from the bank.
     */
    function withdraw(uint256 _amount) public returns(uint256) {
        
        require(accounts[msg.sender] >= _amount, 'Insufficient funds');

        // Deduct from bank
        accounts[msg.sender] -= _amount;
        address payable receiver = payable(msg.sender); 
        receiver.transfer(_amount);     
        return accounts[msg.sender];
    }


    /**
     * @dev Withdraw funds from the bank and receive DBC Token interest.
     * Interest is hard coded to 1 DBC Token
     */
    function withdrawWithInterest(uint256 _amount) public returns(uint256) {
        
        require(accounts[msg.sender] >= _amount, 'Insufficient funds');

        // Deduct from bank
        accounts[msg.sender] -= _amount;
        address payable receiver = payable(msg.sender); 
        receiver.transfer(_amount);     
        
        // Mint a new token and transfer to sender's account
        token.mint(msg.sender, 1**10);
        return accounts[msg.sender];
    }


    /**
     * Get a user's balance
     */
    function getBalance() public view returns(uint256) {
        return accounts[msg.sender];
    }

}
