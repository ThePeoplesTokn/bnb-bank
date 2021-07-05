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

    // Get the account
    const accounts = await web3.eth.getAccounts();
    console.log(accounts[0]);
    this.setState({ account: accounts[0] });
    var balance = web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether');
    balance = Math.round(balance * 100) / 100;
    console.log(balance);
    this.setState({ balance: balance });


  }

  deposit() {
    // 
  }

  withdraw() {

  }


  render() {
    return (
      <div className="App">
        
        <div className="app-header">

          <img className="logo" src={process.env.PUBLIC_URL + '/Palm-Tree-small.png'} />
          
          <h1>Welcome to BNB Bank</h1>
        </div>
        
        {/* <div className="network">
          <p><b>Network: </b>{this.state.network}</p>
        </div> */}

        <div className="account-number">
          <p><b>Account number: </b>{this.state.account}</p>
        </div>

        <div className="balance-display">
          <p><b>Balance: </b>{this.state.balance} BNB</p>
        </div>

        <div>

        </div>

      </div>
    );
  }
}

export default App;
