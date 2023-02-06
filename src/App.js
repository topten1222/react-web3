import React, { useState, useEffect } from 'react'
import { initializeConnector } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'
import { ethers } from 'ethers';
import { formatEther, parseUnits } from '@ethersproject/units';
import abi from './contract/abi.json'
import Web3 from 'web3'

import { 
  AppBar, Toolbar, Typography, Button, Chip, Stack, Container, Card,
  CardContent, TextField, Divider
} from '@mui/material';



const [metamask, hooks] = initializeConnector((actions) => new MetaMask(actions))
const { useAccounts, useIsActive, useProvider } = hooks

const contractAddress = '0x848Bb450D01Cb7353b34a9dad027e11C00b5E75d'

const getAddressTxt = (str, s = 6, e = 6) => {
  if (str) {
    return `${str.slice(0, s)}...${str.slice(str.length - e)}`;
  }
  return "";
};

function App() {
  const accounts = useAccounts()
  const isActive = useIsActive()
  const provider = useProvider()
  const [balance, setBalance] = useState("")
  const [reiValue, setReiValue] = useState(0)
  const [nft, setNftValue] = useState([])

  //load page initial function
  useEffect(() => {
    void metamask.connectEagerly()
  }, [])
  const fetchBalance = async () => {
    try{
      const signer = provider.getSigner()
      const smartContract = new ethers.Contract(contractAddress, abi, signer)
      const balance = await smartContract.balanceOf(accounts[0])
      console.log(balance)
      setBalance(formatEther(balance))
    }catch(err) {
      console.log(err)
    }
  }

  const fetchNFT = async () => {
    try{
      const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545")
      const tokenContract = new ethers.Contract(contractAddress, abi, provider)
      const response = await fetch(`https://api-testnet.bscscan.com/api?module=account&action=tokennfttx&address=${accounts[0]}&startblock=0&endblock=999999999&sort=asc`);
      const data = await response.json();
      const result = [];
      for (let index = 0; index < data.result.length; index++) {
        console.log(data.result[index].contractAddress.toLowerCase())
        console.log(contractAddress)
        if (contractAddress.toLowerCase() !== data.result[index].contractAddress.toLowerCase()) {
          continue
        }
        const tokenID = data.result[index].tokenID
        const tokenURI = await tokenContract.tokenURI(tokenID)
        const jsonData = decodeURI(tokenURI)
        console.log(tokenURI)
        let json = jsonData.substring(22);
        const uriJson = decodeURIComponent(json);
        //remark convert encode uri contract wrong beacuse fix replace
        json = uriJson.replaceAll('\\', '').replaceAll('"{', '{').replaceAll(',}"', '}')
        result.push(JSON.parse(json));
      }
      setNftValue(result)      
    }catch(err) {
      console.log(err)
    }
  }

  
  useEffect(() => {
    //fetchBalance()
    if (isActive) {
      fetchNFT()
    }

  }, [isActive])

  const handleConnect = () => {
    //55556 เลข chain ID
    metamask.activate(97)
  }

  const handleDisconnect = () => {
    metamask.deactivate()
  }

  const handleBuy = async () => {
    try {
      const signer = provider.getSigner()
      const smartContract = new ethers.Contract(contractAddress, abi, signer)
      const txHash = await smartContract.buy({
        from: accounts[0],
        value: parseUnits(reiValue, "ether")
      })
      //track events
      smartContract.on("Buy", (from, to, token) => {
        fetchBalance()
      })
    }catch (err) {
      console.log(err)
    }
  }

  return (
    <div>
      <AppBar position="static" color="transparent">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My DApp
          </Typography>
          
          {!isActive ? 
            <Button variant="contained" 
              color="inherit"
              onClick={handleConnect}
            >
              Connect to Wallet
            </Button>
          :
            <Stack direction="row" spacing={1}>
              <Chip label={getAddressTxt(accounts[0])} />
              <Button variant="contained" 
                color="inherit"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </Stack>
          }
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ mt: 2 }}>
        { isActive &&
          <div>
            <h2>Wallet ID: {accounts[0]}</h2>
            {nft.map((element, index) => {
              return (
                <div key={index}>
                  <h2>NAME: {element.name}</h2>
                  <h2>Description: {element.description}</h2>
                  <img src={element.image} width="300px"/>
                </div>
              );
            })}
          </div>
        }
      </Container>

    </div>
  )
}

export default App