import React, {Component} from 'react';
// import ReactDOM from 'react-dom';
import './App.css';
// import detectEthereumProvider from '@metamask/detect-provider';
// import MetaMaskOnboarding from '@metamask/onboarding';
import Web3 from 'web3';
import Bank from './abis/Bank.json';

// const currentUrl = new URL(window.location.href)
// const forwarderOrigin = currentUrl.hostname === 'localhost' ? 'http://localhost:9010': undefined;

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      web3: '',
      account: '',
      walletBalance: 0,
      bankBalance: 0,  
      bankAddress: null,
      bank: null,
      token: null,
      network: null
    };
    // this.deposit = this.deposit.bind(this);
    // this.withdraw = this.withdraw.bind(this);
  }
  
  componentWillMount() {
    this.loadBlockChainData();
    // this.getBank();
  }

  /**
   * Load blockchain data from MetaMask
   */
  loadBlockChainData = async () => {

    const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");
    this.setState({ web3: web3 });
    const network = await web3.eth.net.getNetworkType()
    this.setState({ network: network });
    console.log(network);
    console.log(web3.eth.symbol)
    // console.log(this.state.web3);
    try {

      // Load Bank contract - get balance for the user
      const networkId = await web3.eth.net.getId();
      console.log('networkId', networkId);
      const deployedNetwork = Bank.networks[networkId];
      if (deployedNetwork) {
        console.log('deployedNetwork', deployedNetwork); // maybe some error handling here fo different network
        const address = deployedNetwork.address  
        console.log('address', address);
        this.setState({ bankAddress: address });
        this.setState({ bank: new web3.eth.Contract(
          Bank.abi,
          deployedNetwork && address,
        )});

        this.connect(); // if user is logged in

      } else {
        // Prompt network change
        console.log('change network');
        console.log(Object.keys(Bank.networks)[0]);
        let chainId = Object.keys(Bank.networks)[0];
        chainId = web3.utils.toHex(chainId);
        console.log(chainId);
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainId }], 
        });
        //window.alert('MetaMask is using a different network'); // Maybe a different message here
      }


      
    } 
    catch(error){
      console.log('user is not logged in');
      // show connect button
    }

    //ethereum.on('chainChanged', handler: (chainId: string) => void);
    // ethereum.on('chainChanged', (_chainId) => window.location.reload());


    // TODO on network switch reload page...
    // // Handle changes in network...
    // function handleChainChanged(_chainId) {
    //   // Reload page on chain changes
    //   console.log('chain changed - reload');
    //   console.log(_chainId);
    //   window.location.reload();
    // }
    // const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    // window.ethereum.on('chainChanged', handleChainChanged(chainId));
    

  }


  connect = async() => {
    const accounts = await this.state.web3.eth.getAccounts();
    //const accounts = ['0xCEFDEC96d09366EA95Bb192195Ab5Ae4fa1e765D']
    this.setState({ account: accounts[0] });
    // var balance = this.state.web3.utils.fromWei(await this.state.web3.eth.getBalance(accounts[0]), 'ether');
    // balance = Math.round(balance * 100) / 100;
    // this.setState({ balance: balance });
    this.updateBalance();
  }

  login = async() => {
    if (window.ethereum) {
      await window.ethereum.send('eth_requestAccounts');
      window.web3 = new Web3(window.ethereum);
      
      this.connect();
    } 
    else {
      console.log('no ethereum detected');
      window.alert('Please install MetaMask to continue');
    }

  }

  deposit = async(amount) => {

    const { web3, bank, account } = this.state;
    const value = web3.utils.toWei(amount, 'ether');

    // Send Request
    const receipt = await bank.methods.deposit().send({ 
          from: account, 
          value: value
    }).catch((error) => {
      console.log('Deposit error: ', error);
      return false;
    });

    // Update balance in window
    this.updateBalance();
    return true;
  }

  withdraw = async(amount) => {

    const { web3, bank, account } = this.state;
    const value = web3.utils.toWei(amount, 'ether');

    // Send request
    const receipt = await bank.methods.withdraw(value).send({ 
      from: account
    }).catch((error) => {
      console.log('Withdraw error: ', error);
      return false;
    });

    // Update balance in window
    this.updateBalance();
    return true;
  }


  withdrawWithToken = async(amount) => {

    const { web3, bank, account } = this.state;
    const value = web3.utils.toWei(amount, 'ether');

    console.log('withdrawing');
    // Send request
    const receipt = await bank.methods.withdrawWithInterest(value).send({ 
      from: account
    }).catch((error) => {
      console.log('Withdraw error: ', error);
      return false;
    });
    
    // Update balance in window
    console.log('Withdraw:', receipt);
    this.updateBalance();
    console.log('done');
    return true;
  }

  updateBalance = async() => {
    const { web3, bank, account } = this.state;
    let walletBalance, bankBalance;

    // Get wallet balance
    walletBalance = web3.utils.fromWei(await web3.eth.getBalance(account), 'ether');
    walletBalance = Math.round(walletBalance * 100) / 100;
    this.setState({ walletBalance: walletBalance });

    // Bet BNB-Bank balance
    bankBalance = await bank.methods.getBalance().call({ from: account });
    bankBalance = web3.utils.fromWei(bankBalance, 'ether');
    bankBalance = Math.round(bankBalance * 100) / 100;
    this.setState({ bankBalance: bankBalance });
  }


  render() {

    const isConnected = this.state.account === '' ? false : true;
    let connect, account, walletBalance, bankBalance;
    if (isConnected) {
      console.log(true);
      connect = <p>Connected</p>
      account = <p><b>Account: </b><span className="numeric-field">{this.state.account}</span></p>
      walletBalance = <p><b>Wallet: </b><span className="numeric-field">{this.state.walletBalance}</span> BNB</p>
      bankBalance = <p><b>BNB balance: </b><span className="numeric-field">{this.state.bankBalance}</span> BNB</p>

    } else {
      console.log(false);
      connect = <button onClick={this.login}>Connect</button>
      account = <div></div>
      walletBalance = <div></div>
      bankBalance = <div></div>
    }

    return (
      <div className="App">
        
        <div className="app-header">

          <img className="logo" src={process.env.PUBLIC_URL + '/Palm-Tree-small.png'} />
          
          <h1>Welcome to BNB Bank</h1>

        </div>

        <div className="connect">
            {connect}
        </div>

        <div className="account-number">
          {account}
        </div>

        <div className="wallet-balance-display">
          {walletBalance}
        </div>

        <div className="bank-balance-display">
          {bankBalance}
        </div>

        <div className="transactions">

          <TransactionInput
            transactionType={'Deposit'}
            onClick={this.deposit}
          />

          <TransactionInput
            transactionType={'Withdraw'}
            onClick={this.withdraw}
          />

          <TransactionInput
            transactionType={'Get Token'}
            onClick={this.withdrawWithToken}
          />
         
        </div>

      </div>
    );
  }
}


/**
 * Component handles user input for transaction requests
 */
class TransactionInput extends Component {

  constructor(props){
    super(props);
    this.state = {
      transactionValue: ''
    };
  }

  /**
   * Call one of the App transaction methods passed in props, passing valid input as argument
   */
  handleClick = () => {
    const value = this.state.transactionValue;
    if (value) {
      const success = this.props.onClick(value);
      // Remove number from input field if transaction is successful
      if (success) {
        this.setState({ transactionValue: '' });
      }
    }
  }

  /**
   * Check for valid numerical input
   * @param {*} e - input change event
   */
  handleChange = (e) => {
    const regCheck = /^\d+(\.\d{0,18})?$/;
    const value = e.target.value;
    if (value === '' || regCheck.test(value)) {
      this.setState({ transactionValue: e.target.value })
    } 
  }

  render() {

    return (

      <div className="transaction-input">
        <button className="transaction-button" onClick={this.handleClick}>{this.props.transactionType}</button>
        <input className="transaction-input-field" onChange={this.handleChange} type="text" value={this.state.transactionValue} placeholder="amount..."></input>
      </div>

    );
  }
}

export default App;
