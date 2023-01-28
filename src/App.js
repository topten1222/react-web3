import React, { useState, useEffect } from 'react'
import { initializeConnector } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'
import { ethers } from 'ethers';
import { formatEther, parseUnits } from '@ethersproject/units';
import abi from './contract/abi.json'

import { 
  AppBar, Toolbar, Typography, Button, Chip, Stack, Container, Card,
  CardContent, TextField, Divider
} from '@mui/material';



const [metamask, hooks] = initializeConnector((actions) => new MetaMask(actions))
const { useAccounts, useIsActive, useProvider } = hooks

const contractAddress = '0xC0c7DCBee5879b35f4115FDfe2c2Fd5265d32838'

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
  useEffect(() => {
    fetchBalance()
    if (isActive) {
      fetchBalance()
    }

  }, [isActive])

  const handleConnect = () => {
    //55556 เลข chain ID
    metamask.activate(55556)
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
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" align="center">
                    MTK
                  </Typography>
                  <TextField
                    id="address"
                    label="Address"
                    value={accounts[0]}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                  <TextField
                    id="balance"
                    label="MKT Balance"
                    value={balance}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                  <Divider/>
                  <Typography variant="body1">
                    Buy MTK (1 REI = 10 MKT)
                  </Typography>
                  <TextField
                    required
                    id="outlined-required"
                    label="REI"
                    defaultValue=""
                    type="number"
                    onChange={(e) => setReiValue(e.target.value)}
                  />
                  <Button variant="contained" onClick={handleBuy}>Buy</Button>

                </Stack>
              </CardContent>
            </Card>
          </div>
        }
      </Container>

    </div>
  )
}

export default App