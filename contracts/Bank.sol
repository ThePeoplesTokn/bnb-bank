pragma solidity >=0.4.22 <0.9.0;

/**
 * Implements the BNB-Bank
 * Allows user to deposit and withdraw funds
 */
contract Bank {

    address public owner;
    mapping(address => uint256) private accounts;

    event LogDeposit(address indexed account, uint256 amount);
    event LogWithdrawal(address indexed account, uint256 amount);


    /**
     * Create the Bank contract
     */
    constructor () {
        owner = msg.sender;
    }


    /**
     * Deposit funds in the bank
     * A check for adequate user funds in MetaMask will be conducted client side
     */
    function deposit() public payable returns(uint256) {
        accounts[msg.sender] += msg.value;  // returns 0 if key is not in mapping 
        emit LogDeposit(msg.sender, msg.value);      
        return accounts[msg.sender];
    }


    /**
     * Withdraw funds from the bank.
     */
    function withdraw(uint256 _amount) public payable returns(uint256) {
        require(accounts[msg.sender] >= _amount, 'Insufficient funds');

        // Check funds were withdrawn
        (bool sent, ) = msg.sender.call{value: _amount}("");
        require(sent, "Failed to send Ether");

        // Deduct from bank
        accounts[msg.sender] -= _amount;
        emit LogWithdrawal(msg.sender, msg.value);      
        return accounts[msg.sender];
    }


    /**
     * Get a user's balance
     */
    function getBalance() public view returns(uint256) {
        return accounts[msg.sender];
    }

}
