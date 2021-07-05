import React, {Component} from 'react';
// import ReactDOM from 'react-dom';
import './App.css';
// import detectEthereumProvider from '@metamask/detect-provider';
// import MetaMaskOnboarding from '@metamask/onboarding';
import Web3 from 'web3';

// const currentUrl = new URL(window.location.href)
// const forwarderOrigin = currentUrl.hostname === 'localhost' ? 'http://localhost:9010': undefined;

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      web3: '',
      account: '',
      token: null,
      dbank: null,
      balance: 0,
      dBankAddress: null,
      network: ''
    }
  }
  
  componentWillMount() {
    this.loadBlockChainData();
  }

  /**
   * Load blockchain data from MetaMask
   */
  async loadBlockChainData() {

    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    this.setState({ web3: web3 });
    const network = await web3.eth.net.getNetworkType()
    this.setState({ network: network });
    console.log(network);
    console.log(this.state.web3);
    try {
      this.connect(); // if user is logged in
    } 
    catch(error){
      console.log('user is not logged in');
      // show connect button
    }

    // Get the account
    // const accounts = await web3.eth.getAccounts();
    // console.log(accounts[0]);
    // this.setState({ account: accounts[0] });
    // var balance = web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether');
    // balance = Math.round(balance * 100) / 100;
    // console.log(balance);
    // this.setState({ balance: balance });


  }

  // async getAccount() {
  //   // Get the account
  //   const accounts = await this.web3.eth.getAccounts();
  //   console.log(accounts[0]);
  //   this.setState({ account: accounts[0] });
  //   var balance = this.web3.utils.fromWei(await this.web3.eth.getBalance(accounts[0]), 'ether');
  //   balance = Math.round(balance * 100) / 100;
  //   console.log(balance);
  //   this.setState({ balance: balance });
  // }

  async connect() {
    console.log(this.state.web3);
    console.log('connect');
    const accounts = await this.state.web3.eth.getAccounts();
    console.log(accounts[0]);
    this.setState({ account: accounts[0] });
    var balance = this.state.web3.utils.fromWei(await this.state.web3.eth.getBalance(accounts[0]), 'ether');
    balance = Math.round(balance * 100) / 100;
    console.log(balance);
    this.setState({ balance: balance });
    
  }

  async login () {
    console.log('login');
    if (window.ethereum) {
      console.log('ethereum');
      await window.ethereum.send('eth_requestAccounts');
      window.web3 = new Web3(window.ethereum);
      this.connect();
    } 
    else {
      console.log('no ethereum detected');
      window.alert('Please install MetaMask to continue');
    }

  }

  deposit() {
    // TO DO
    console.log('deposit');
  }

  withdraw() {
    // TO DO
    console.log('withdraw');
  }

  getToken() {
    // TO DO
    console.log('token');
  }


  render() {

    const isConnected = this.state.account === '' ? false : true;
    let connect, account, balance;
    if (isConnected) {
      console.log(true);
      connect = <p>Connected</p>
      account = <p><b>Account: </b>{this.state.account} BNB</p>
      balance = <p><b>Balance: </b>{this.state.balance} BNB</p>
    } else {
      console.log(false);
      connect = <button onClick={this.login}>Connect</button>
      account = <div></div>
      balance = <div></div>
    }

    return (
      <div className="App">
        
        <div className="app-header">

          <img className="logo" src={process.env.PUBLIC_URL + '/Palm-Tree-small.png'} />
          
          <h1>Welcome to BNB Bank</h1>

        </div>
        
        {/* <div className="network">
          <p><b>Network: </b>{this.state.network}</p>
        </div> */}


        <div className="connect">
          {/* <ConnectButton 
            onClick={this.login}
            /> */}
            {connect}
        </div>


        <div className="account-number">
          {account}
        </div>

        <div className="balance-display">
          {balance}
        </div>

        <div className="transactions">
          
          <div className="widthdraw">
            <button onClick={this.withdraw}>widthdraw</button>
          </div>

          <div className="deposit">
            <button onClick={this.deposit}>deposit</button>
          </div>

        </div>

        <div className="add-token">
          <button onClick={this.getToken}>Get token</button>
        </div>

      </div>
    );
  }
}


// function ConnectButton(props){
//   if (!props.isConnected){
//     <button className="connect-button" onClick={props.onClick}>Connect</button>
//   }
// }

export default App;
