const Bank = artifacts.require('./Bank.sol');
const Token = artifacts.require('./Token.sol');


/**
 * Testing Bank contract functionality, and Bank - Token interaction.
 */
contract('Bank', function(accounts) {

    const alice = accounts[1];
    const bob = accounts[2];


    // Currently there is no functionality to register a new user - so everyone has a balance of 0 by default
    it('should return a balance of 0 for new users', async () => {
        const bank =  await Bank.deployed();
        const balance = await  bank.getBalance({ from: bob });
        assert.equal(balance.toString(), '0', "New user's balance is not '0'");
    });


    it('should throw an exception when withdrawing from an empty account', async () => {
        const bank =  await Bank.deployed();

        // Withdraw from empty account
        await bank.withdraw({ from: alice }).then(
            () => Promise.reject(new Error('Insufficient funds')),
            err => assert.instanceOf(err, Error)
        );
    });


    it('should deposit the correct amount', async () => {
        
        const bank =  await Bank.deployed();
        let balanceBefore, balanceAfter;
        // Get the bank balance before the transaction
        balanceBefore = await  bank.getBalance({ from: alice });
        
        // Deposit 1 Ether
        const deposit = web3.utils.toWei('1', 'ether');
        const transactionBalance = await bank.deposit({ 
            from: alice, 
            value: deposit
        });
        
        // Get the bank balance after the transaction
        balanceAfter = await bank.getBalance({ from: alice });

        assert.equal(balanceAfter - balanceBefore, deposit, 'Bank balance is not updated after deposit');
    });


    it("should deduct the correct amount from a user's wallet", async() => {

        const bank =  await Bank.deployed();
        let balanceBefore, balanceAfter;

        // Get the user's wallet balance before transaction
        await web3.eth.getBalance(alice, (err, result) => {
            balanceBefore = result;
        })

        // Deposit 1 Ether
        const deposit = web3.utils.toWei('1', 'ether');
        const receipt = await bank.deposit({ 
            from: alice, 
            value: deposit
        });

        // Get gasUsed and gasPrice
        const gasUsed = receipt.receipt.gasUsed;
        const tx = await web3.eth.getTransaction(receipt.tx);
        const gasPrice = tx.gasPrice;
        
        // Get the user's wallet balance after transaction
        await web3.eth.getBalance(alice, (err, result) => {
            balanceAfter = result;
        })

        const difference = balanceBefore - balanceAfter;
        assert.equal(difference, parseInt(deposit) + gasUsed * gasPrice, "User's wallet balance is not updated after deposit");
    });


    it("should decrease the funds in a user's account on successful withdrawal", async() => {

        const bank =  await Bank.deployed();
        let balanceBefore, balanceAfter;

        // Get the bank balance before the transaction
        balanceBefore = await  bank.getBalance({ from: alice });
        assert.notEqual(balanceBefore, 0, '0 funds in deposit account');

        // Withdraw all funds
        await bank.withdraw({ from: alice });
        
        // Get the bank balance after the transaction
        balanceAfter = await bank.getBalance({ from: alice });

        assert.equal(balanceAfter, 0,  "User's account balance is not updated after withdrawal");
    });


    it("should increase the funds in a user's wallet on successful withdrawal", async() => {

        const bank =  await Bank.deployed();
        let walletBefore, walletAfter, depositSum;

        // Need to deposit Ether first
        const deposit = web3.utils.toWei('1', 'ether')
        transactionBalance = await bank.deposit({ 
            from: alice, 
            value: deposit
        });

        // Check the bank balance before the transaction
        depositSum = await  bank.getBalance({ from: alice });
        assert.notEqual(depositSum, 0, '0 funds in deposit account');

        // Get the user's wallet balance before transaction
        await web3.eth.getBalance(alice, (err, result) => {
            walletBefore = result;
        })
        
        // Withdraw 1 Ether
        const receipt = await bank.withdraw({ from: alice });

        // Get gasUsed and gasPrice
        const gasUsed = receipt.receipt.gasUsed;
        const tx = await web3.eth.getTransaction(receipt.tx);
        const gasPrice = tx.gasPrice;

        // Get the user's wallet balance after transaction
        await web3.eth.getBalance(alice, (err, result) => {
            walletAfter = result;
        })
        
        const difference = walletAfter - walletBefore;
        assert.equal(difference, depositSum - (gasUsed * gasPrice),  "User's wallet balance is not updated after withdrawal");
    
    });


    it("should decrease the funds in a user's account on successful withdrawal with token", async() => {

        const token = await Token.deployed();
        const bank =  await Bank.deployed(token.address);

        let balanceBefore, balanceAfter;

        // Need to deposit Ether first
        const deposit = web3.utils.toWei('1', 'ether');
        transactionBalance = await bank.deposit({ 
            from: alice, 
            value: deposit
        });

        // Get the bank balance before the transaction
        balanceBefore = await  bank.getBalance({ from: alice });
        assert.notEqual(balanceBefore, 0,  '0 funds in deposit account');

        // Withdraw all funds with token interest
        await bank.withdrawWithInterest({ from: alice });
        
        // Get the bank balance after the transaction
        balanceAfter = await bank.getBalance({ from: alice });

        assert.equal(balanceAfter, 0, "User's account balance is not updated after withdrawal");

    });


    it("should increase the funds in a user's wallet on successful withdrawal with token", async() => {

        const token = await Token.deployed();
        const bank =  await Bank.deployed(token.address);
        let walletBefore, walletAfter, depositSum;

        // Deposit Ether
        const deposit = web3.utils.toWei('1', 'ether');
        transactionBalance = await bank.deposit({ 
            from: alice, 
            value: deposit
        });

        // Check the bank balance before the transaction
        depositSum = await  bank.getBalance({ from: alice });
        assert.notEqual(depositSum, 0, '0 funds in deposit account');

        // Get the user's wallet balance before transaction
        await web3.eth.getBalance(alice, (err, result) => {
            walletBefore = result;
        });

        // Withdraw all funds with interest in tokens
        const receipt = await bank.withdrawWithInterest({ from: alice });

        // Get gasUsed and gasPrice
        const gasUsed = receipt.receipt.gasUsed;
        const tx = await web3.eth.getTransaction(receipt.tx);
        const gasPrice = tx.gasPrice;

        // Get the user's wallet balance after transaction
        await web3.eth.getBalance(alice, (err, result) => {
            walletAfter = result;
        })
        
        const difference = walletAfter - walletBefore;
        assert.equal(difference, depositSum - (gasUsed * gasPrice),  "User's wallet balance is not updated after withdrawal");

    });


    it('should increase the total supply of tokens when tokens are withdrawn', async() => {

        const token = await Token.deployed();
        const bank =  await Bank.deployed(token.address);

        // Get the token supply before new minting
        let totalSupply = await token.totalSupply();

        assert.notEqual(totalSupply, 0, 'No tokens were minted during previous withdrawals');

        // Need to deposit Ether first
        const deposit = web3.utils.toWei('1', 'ether');
        transactionBalance = await bank.deposit({ 
            from: alice, 
            value: deposit
        });

        // Withdraw all funds with token interest
        await bank.withdrawWithInterest({ from: alice });
    
        // New tokens should have been minted
        totalSupply = await token.totalSupply() - totalSupply;
        assert.equal(totalSupply, deposit / 100000, 'Tokens were not minted.');

    });
    
})
