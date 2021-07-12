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
    function withdraw() public returns(uint256) {
        
        uint256 balance = accounts[msg.sender];
        require(balance > 0, 'Account is empty');

        // Deduct from bank
        accounts[msg.sender] -= balance;
        address payable receiver = payable(msg.sender); 
        receiver.transfer(balance);     
        return accounts[msg.sender];
    }


    /**
     * @dev Withdraw funds from the bank and receive DBC Token interest.
     * Interest is hard coded to 1 DBC Token
     */
    function withdrawWithInterest() public returns(uint256) {
        
        uint256 balance = accounts[msg.sender];
        require(balance > 0, 'Account is empty');

        // Deduct from bank
        accounts[msg.sender] -= balance;
        payable(msg.sender).transfer(balance);     
        
        // Mint and transfer new tokens to sender's account
        token.mint(msg.sender, balance / 100000);
        return accounts[msg.sender];
    }


    /**
     * Get a user's balance
     */
    function getBalance() public view returns(uint256) {
        return accounts[msg.sender];
    }
}
