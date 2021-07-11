import React, {Component} from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './App.css';
import Web3 from 'web3';
import Bank from './abis/Bank.json';

/**
 * Main app component
 */
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
      network: null,
      connected: false
    };
  }
  
  componentWillMount() {
    this.connect();
  }


  /**
   * Checks if a user is logged into MetaMask.
   * If logged in loads block chain data.
   * Else, waits for the user to choose to connect with connect button - no unprovoked pop-ups.
   */
  connect = async() => {

    try {
      const connected = window.ethereum.isConnected();
      if (! connected) {
        console.log('Connect: User is not logged in');
        // User is not logged in - show connect button
      } else {
        console.log('Connect: User is logged in');
        // User is logged in - load block chain data
        this.loadBlockChainData();
      }
    } catch(error) {
      console.log('Connect error:', error);
      // User is not logged in - show connect button
    }
    
  }


  /**
   * Load blockchain data from MetaMask
   */
  loadBlockChainData = async () => {

    if (window.ethereum) {

      // Calls MetaMask pop-up
      await window.ethereum.send('eth_requestAccounts');  
      window.web3 = new Web3(window.ethereum);
      this.setState({ web3: window.web3 });
      this.setState({ connected: true });

      // Set event handler to reload page on network changes
      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
      });

      // Load Bank contract - get balance for the user
      let networkId = await window.web3.eth.net.getId();
      console.log('networkId', networkId);
      let deployedNetwork = Bank.networks[networkId];
      if (!deployedNetwork) {

        console.log('network change required');
        try {
          // Prompt network change
          console.log('change network');
          console.log(Object.keys(Bank.networks)[0]);
          let chainId = Object.keys(Bank.networks)[0];
          chainId = window.web3.utils.toHex(chainId);
          console.log(chainId);
  
          // Add the TestNet chain if necessary
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: chainId,
              chainName: "Ganache",
              rpcUrls: ["http://127.0.0.1:7545"],
              nativeCurrency: {
                name: "ETHER",
                symbol: "ETH",
                decimals: 18,
              },
              blockExplorerUrls: ["http://127.0.0.1:7545"],
            }]
          });

          // Switch chain
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainId }], 
          });

          // reassign network variables
          networkId = await window.web3.eth.net.getId();
          console.log('networkId', networkId);
          deployedNetwork = Bank.networks[networkId];
 
        } catch (error) {
          console.log('Please change network with MetaMask');
        }
      } 
      if (deployedNetwork) {
        console.log('deployedNetwork', deployedNetwork); 
        const address = deployedNetwork.address  
        console.log('address', address);
        this.setState({ bankAddress: address });
        this.setState({ bank: new window.web3.eth.Contract(
          Bank.abi,
          deployedNetwork && address,
        )});

        // Get user's address and update user's balance
        const accounts = await this.state.web3.eth.getAccounts();
        this.setState({ account: accounts[0] });
        this.updateBalance();
        
      }
    }
    else {
      console.log('Please install MetaMask to continue');
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

  /**
   * Upadates the user's balance display after a transaction.
   */
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

    let main;
    if (this.state.connected) {
      console.log(true);

      if (!this.state.bankAddress) {

        main = <div className="main">

                <p>Please change network in MetaMask</p>

               </div>

      }
      else {


        main = <div className="main">

                  <p><b>Your Address: </b><span className="numeric-field">{this.state.account}</span></p>
                  {/* <p><b>Wallet: </b><span className="numeric-field">{this.state.walletBalance}</span> BNB</p> */}
                  <p><b>BNB balance: </b><span className="numeric-field">{this.state.bankBalance}</span> BNB</p>
                  
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
      }

    } else {
      console.log(false);
      main = <div className="main">

                <p>Log in with MetaMask to continue.</p>

                <button id="connect-button" onClick={this.loadBlockChainData}>Connect</button>

                <p>Don't have MetaMask installed? Get it <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">here</a>.</p>
             
              </div>
    }

    return (
      <div className="App">

        
        <div className="app-header">

          <img className="logo" src={process.env.PUBLIC_URL + '/Palm-Tree-small.png'} />
          
          <h1>Welcome to BNB Bank</h1>

        </div>

        {main}

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
    if (value === '' || value == 0) {
      this.setState({ msg: 'Please enter an amount'});
    } else if (value) {
      this.setState({ msg: ''});
      const success = this.props.onClick(value);
      // Remove number from input field if transaction is successful
      if (success) {
        this.setState({ transactionValue: '' });
      }
    }
    
  }

  /**
   * Check for valid numerical input, numbers are limited to two decimal places.
   * @param {*} e - input change event
   */
  handleChange = (e) => {
    const regCheck = /^\d+(\.\d{0,2})?$/;
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
        <span className="error-message">{this.state.msg}</span>
      </div>
     
      
    );
  }
}

export default App;
