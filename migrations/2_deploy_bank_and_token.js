const Bank = artifacts.require('Bank.sol');
const Token = artifacts.require('Token.sol');


module.exports = async(deployer) => { 
  // deployer.deploy(Token).then(function() { 
  //   return deployer.deploy(Bank, Token.address);
  // });
  await deployer.deploy(Token);
  const token = await Token.deployed();
  await deployer.deploy(Bank, Token.address);
  const bank = await Bank.deployed();
  // Change minter to the bank
  await token.changeMinter(bank.address);
};

