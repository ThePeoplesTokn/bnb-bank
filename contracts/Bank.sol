pragma solidity ^0.8.4;

/**
 * Implements the BNB-Bank
 * Allows user to deposit and withdraw funds
 */
contract Bank {

    // Stores user balance <address, balance>
    mapping(address => uint256) public accounts;

    /**
     * Deposit funds in the bank
     * A check for adequate user funds in MetaMask will be conducted client side
     */
    function deposit(uint256 amount) public returns(uint256){
        // if (accounts[tx.origin].isEntity) throw;
        uint256 balance = accounts[tx.origin] + amount;  // returns 0 if key is not in mapping
        accounts[tx.origin] = balance;
        return balance;
        
    }

    /**
     * Withdraw funds from the bank.
     * Check for sufficient funds is done client side
     */
    function withdraw(uint256 amount) public returns(uint256) {
        require(accounts[tx.origin] >= amount, 'Insufficient funds');
        uint balance = accounts[tx.origin] - amount;
        accounts[tx.origin] = balance;
        return balance;
    }

    /**
     * Get a user's balance
     */
    function getBalance() public view returns(uint balance) {
        return accounts[tx.origin];
    }

}