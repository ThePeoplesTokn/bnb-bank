import React, { Component } from 'react';
import { Row, Col, Tab, Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Web3 from 'web3';
import Bank from './abis/Bank.json';
import { DepositInput, WithdrawInput } from './TransactionInputs';

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
        // User is not logged in - show connect button
      } else {
        // User is logged in - load block chain data
        this.loadBlockChainData();
      }
    } catch(error) {
      // User is not logged in - show connect button
    }
    
  }


  /**
   * Load blockchain data from MetaMask - account addresses, balances etc.
   * Also checks that the right network is connected in MetaMask
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
      let deployedNetwork = Bank.networks[networkId];
      if (!deployedNetwork) {

        try {
          // Prompt network change
          let chainId = Object.keys(Bank.networks)[0];
          chainId = window.web3.utils.toHex(chainId);
  
          // Add the TestNet chain if necessary
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: '0x61',
              chainName: "Smart Chain - Testnet",
              rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
              nativeCurrency: {
                name: "BNB",
                symbol: "BNB",
                decimals: 18,
              },
              blockExplorerUrls: ["https://testnet.bscscan.com"],
            }]
          });

          // Switch chain
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainId }], 
          });

          // reassign network variables
          networkId = await window.web3.eth.net.getId();
          deployedNetwork = Bank.networks[networkId];
 
        } catch (error) {
          console.log('Please change network with MetaMask');
        }
      } 
      if (deployedNetwork) {
        const address = deployedNetwork.address  
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


  /**
   * Deposits funds into a user's bank account. Users can make multiple deposits.
   * Input is parsed in the DepositInput component to allow a minimum deposit amount of 0.01
   * @param {*} amount - the amount to deposit
   * @returns true if successful, false otherwise
   */
  deposit = async(amount) => {

    const { web3, bank, account } = this.state;
    const value = web3.utils.toWei(amount, 'ether');

    // Send Request
    const receipt = await bank.methods.deposit().send({ 
          from: account, 
          value: value
    }).catch((error) => {
      return false;
    });

    // Update balance in window
    this.updateBalance();
    return true;
  }


  /**
   * Withdraws all funds from a user's bank account, and transfers tokens if selected
   * @param {*} method - if true, the transaction withdraws with added token, 
   * otherwise it withdraws without added token interest
   * @returns true if withdraw was successfull, false otherwise.
   */
  withdraw = async(method) => {

    const { bank, account } = this.state;

    if (! method) {

      // Withdraw
      await bank.methods.withdraw().send({ 
        from: account
      }).catch((error) => {
        return false;
      });

    } else {

      // Withdraw with token interest
      await bank.methods.withdrawWithInterest().send({ 
        from: account
      }).catch((error) => {
        return false;
      });

    }
    
    // Update balance in window
    this.updateBalance();
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

    // There are three cases that the App renders:
    // 1. The user is connected to MetaMask, but the wrong network
    // 2. The user is connected to MetMask and the correct network
    // 3. The user is not connected to MetaMask

    let main;
    if (this.state.connected) {

      // 1. The user is connected to MetaMask, but the wrong network
      // Should change network automatically, but message to change enetwork is displayed if not
      if (!this.state.bankAddress) {

        main = <div className="main">
                <p id="change-network">To continue, please select the Testnet network in MetaMask</p>
               </div>

      }
      else {

        // 2. The user is connected to MetMask and the correct network
        // Renders the main content of the website - deposit and withdraw features
        main = <div className="main">

                  <div id="address">
                    <p>Your Address: </p>
                    <p id="address-hash" className="numeric-field">{this.state.account}</p>
                  </div>
                  {/* <p><b>Wallet: </b><span className="numeric-field">{this.state.walletBalance}</span> BNB</p> */}
                  <div id="balance">
                    <p>Bank balance: <span className="numeric-field">{this.state.bankBalance} BNB</span> </p>
                  </div>
                  
                  <div id="transactions">
                  
                    <Tab.Container id="transaction-selection" defaultActiveKey="first">
                      <Row className="row">
                        <Col className="col">
                          <Nav  variant="pills" className="flex-column">
                            <Nav.Item>
                              <Nav.Link className="tabs" eventKey="first">Deposit</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                              <Nav.Link className="tabs" eventKey="second">Withdraw</Nav.Link>
                            </Nav.Item>
                          </Nav>
                        </Col>
                        <Col className="col">
                          <Tab.Content className="tab-content">
                            <Tab.Pane eventKey="first">

                              <DepositInput className="top"
                                transactionType={'Deposit'}
                                onClick={this.deposit}
                              />

                            </Tab.Pane>
                            <Tab.Pane eventKey="second">

                              <WithdrawInput className="top"
                                transactionType={'Withdraw'}
                                onClick={this.withdraw}
                                balance={this.state.bankBalance}
                              />

                            </Tab.Pane>
                          </Tab.Content>
                        </Col>
                      </Row>
                    </Tab.Container>
          
                  </div>

                </div>
      }

    } else {

      // 3. The user is not connected to MetaMask
      // Renders a prompt to connect with MetaMask
      main = <div className="main">

                <p id="login">Connect with MetaMask to continue.</p>

                <button id="connect-button" onClick={this.loadBlockChainData}>Connect</button>

                <p id="install-link">Don't have MetaMask installed? Get it <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">here</a>.</p>
             
              </div>
    }

    return (

      <div className="App">

        <div className="app-header">

          <img className="logo" src={process.env.PUBLIC_URL + '/Palm-Tree-small.png'} />
          
          <h1 id="welcome">Welcome to BNB Bank</h1>

        </div>

        {main}

      </div>
    );
  }
}

export default App;
