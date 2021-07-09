const Bank = artifacts.require('./Bank.sol');
const Token = artifacts.require('./Token.sol');


/**
 * Testing Bank contract functionality.
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

        // Withdraw 1 ether from account
        const withdrawal = web3.utils.toWei('1', 'ether');
        await bank.withdraw(web3.utils.toBN(withdrawal), { from: alice}).then(
            () => Promise.reject(new Error('Insufficient funds')),
            err => assert.instanceOf(err, Error)
        );
    });


    it('should deposit the correct amount', async () => {
        
        const bank =  await Bank.deployed();
        let balanceBefore, balanceAfter;
        // Get the bank balance before the transaction
        balanceBefore = await  bank.getBalance({ from: alice })
        
        // Deposit 1 Ether
        const deposit = web3.utils.toWei('2', 'ether');
        const transactionBalance = await bank.deposit({ 
            from: alice, 
            value: deposit
        });
        
        // Get the bank balance after the transaction
        balanceAfter = await bank.getBalance({ from: alice })

        assert.equal(balanceAfter - balanceBefore, deposit, 'Bank balance is not updated after deposit')
    });


    it("should deduct the correct amount from a user's wallet", async() => {

        const bank =  await Bank.deployed();
        let balanceBefore, balanceAfter;

        // Get the user's wallet balance before transaction
        await web3.eth.getBalance(alice, (err, result) => {
            balanceBefore = result;
        })

        // Deposit 1 Ether
        const deposit = web3.utils.toWei('2', 'ether')
        const receipt =  transactionBalance = await bank.deposit({ 
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
        balanceBefore = await  bank.getBalance({ from: alice })

        // Withdraw 1 Ether
        const amount = web3.utils.toWei('1', 'ether');
        await bank.withdraw(web3.utils.toBN(amount), { from: alice });
        
        // Get the bank balance after the transaction
        balanceAfter = await bank.getBalance({ from: alice })

        const difference = balanceBefore - balanceAfter;
        assert.equal(difference, amount, "User's account balance is not updated after withdrawal");
    });


    it("should increase the funds in a user's wallet on successful withdrawal", async() => {

        const bank =  await Bank.deployed();
        let balanceBefore, balanceAfter;

        // Get the user's wallet balance before transaction
        await web3.eth.getBalance(alice, (err, result) => {
            balanceBefore = result;
        })

        // Withdraw 1 Ether
        const amount = web3.utils.toWei('1', 'ether');
        const receipt = await bank.withdraw(web3.utils.toBN(amount), { from: alice});
        // console.log(receipt);

        // Get gasUsed and gasPrice
        const gasUsed = receipt.receipt.gasUsed;
        const tx = await web3.eth.getTransaction(receipt.tx);
        const gasPrice = tx.gasPrice;

        // Get the user's wallet balance after transaction
        await web3.eth.getBalance(alice, (err, result) => {
            balanceAfter = result;
        })
        
        const difference = balanceAfter - balanceBefore;
        assert.equal(difference, amount - (gasUsed * gasPrice),  "User's wallet balance is not updated after withdrawal");
    
    });


    it("should decrease the funds in a user's account on successful withdrawal with token", async() => {

        const token = await Token.deployed();
        const bank =  await Bank.deployed(token.address);

        // Change minter
        await token.changeMinter(bank.address);

        let balanceBefore, balanceAfter;

        // Get the bank balance before the transaction
        balanceBefore = await  bank.getBalance({ from: alice })

        // Withdraw 1 Ether
        const amount = web3.utils.toWei('1', 'ether');
        await bank.withdrawWithInterest(web3.utils.toBN(amount), { from: alice });
        
        // Get the bank balance after the transaction
        balanceAfter = await bank.getBalance({ from: alice })

        const difference = balanceBefore - balanceAfter;
        assert.equal(difference, amount, "User's account balance is not updated after withdrawal");
    
        // A token should have been minted
        const totalSupply = await token.totalSupply();
        assert.equal(totalSupply, 1, 'Token was not minted.');

    });


    it("should increase the funds in a user's wallet on successful withdrawal with token", async() => {

        const token = await Token.deployed();
        const bank =  await Bank.deployed(token.address);
        let balanceBefore, balanceAfter;

        // Get the user's wallet balance before transaction
        await web3.eth.getBalance(alice, (err, result) => {
            balanceBefore = result;
        })

        // Withdraw 1 Ether
        const amount = web3.utils.toWei('1', 'ether');
        const receipt = await bank.withdrawWithInterest(web3.utils.toBN(amount), { from: alice});
        // console.log(receipt);

        // Get gasUsed and gasPrice
        const gasUsed = receipt.receipt.gasUsed;
        const tx = await web3.eth.getTransaction(receipt.tx);
        const gasPrice = tx.gasPrice;

        // Get the user's wallet balance after transaction
        await web3.eth.getBalance(alice, (err, result) => {
            balanceAfter = result;
        })
        
        const difference = balanceAfter - balanceBefore;
        assert.equal(difference, amount - (gasUsed * gasPrice),  "User's wallet balance is not updated after withdrawal");
    
        // A token should have been minted
        const totalSupply = await token.totalSupply();
        assert.equal(totalSupply, 1, 'Token was not minted.');
    });
    
})
