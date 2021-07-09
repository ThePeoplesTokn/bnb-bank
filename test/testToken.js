const Bank = artifacts.require('./Bank.sol');
const Token = artifacts.require('./Token.sol');


/**
 * Testing Token contract functionality.
 */
contract('Token', function(accounts) {

    const alice = accounts[1];
    const bob = accounts[2];

    it("it should change the minter of the token", async() => {

        const token = await Token.deployed();
        
        // Change minter
        await token.changeMinter(alice);

        // Minter addresses
        const tokenMinter = await token.minter.call();

        // Check that the bank is now the minter...
        assert.equal(tokenMinter, alice, 'Minter role has not been changed to bank address');
            
    });


    it("it should only allow the minter to mint new tokens", async() => {

        const token = await Token.deployed();
        let totalSupply;

        // Alice is already set to minter
        // Should disallow non-minter from minting
        const amount = web3.utils.toWei('1', 'ether');
        await token.mint(bob, amount, { from: bob }).then(
            () => Promise.reject(new Error('Method is restricted to minter')),
            err => assert.instanceOf(err, Error)
        );

        let tokenMinter = await token.minter.call();

        // // No tokens should be minted
        totalSupply = await token.totalSupply();
        assert.equal(totalSupply, 0, 'Token minted by non-minter');

        // Should allow bank to mint tokens
        await token.mint(bob, amount, { from: alice });

        // The requested amount of tokens should be minted
        totalSupply = await token.totalSupply();
        assert.equal(totalSupply, amount, 'Token was not minted.');

    });
    


})