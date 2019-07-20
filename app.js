require('dotenv').config()
const AMOUNT_TO_MINT = process.env.AMOUNT_TO_MINT || 100

const express = require('express')
const bodyParser = require('body-parser')

const LibraService = require('./service/libra_service')
const LibraDocker = require('./service/libra_docker')
const Faucent = require('./service/faucet')
const USE_KULAP_FAUCET = (undefined === process.env.USE_KULAP_FAUCET) ? true : process.env.USE_KULAP_FAUCET === 'true'

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/', (req, res) => {
  res.send(
    'Please read the docs here https://documenter.getpostman.com/view/1671913/S1a32SZ5?version=latest#14a7b4be-ecd3-4b64-905f-5f386a13727a'
  )
})

app.post('/createWallet', async (req, res) => {
  try {
    console.log('req body', req.body)
    const libra = new LibraService()

    // Create wallet
    const createdResult = await libra.createWallet(AMOUNT_TO_MINT)

    // Mint
    const faucent = new Faucent()
    if (USE_KULAP_FAUCET) {
      await faucent.getFaucetFromKulap(AMOUNT_TO_MINT, createdResult.address)
    } else {
      await faucent.getFaucetFromLibraTestnet(AMOUNT_TO_MINT, createdResult.address)
    }

    const wallet = {
      address: createdResult.address,
      mnemonic: createdResult.mnemonic + ';1',
      balance: AMOUNT_TO_MINT.toString(10)
    }
    console.log('wallet', wallet)
    res.send(wallet)

  } catch (error) {
    console.error(error)
    const response = {
      msg: `${error}`
    }
    res.status(500).send(response)
  }
})

app.post('/getBalance', async (req, res) => {
  try {
    console.log('req body', req.body)
    const libra = new LibraService()

    const address = req.body.address
    const balance = await libra.queryBalance(address)
    const wallet = {
      address: address,
      balance: balance
    }
    console.log('wallet', wallet)
    res.send(wallet)

  } catch (error) {
    console.error(error)
    const response = {
      msg: `${error}`
    }
    res.status(500).send(response)
  }
})

app.post('/transfer', async (req, res) => {
  try {
    console.log('req body', req.body)
    const libra = new LibraService()

    // let fromAddress = req.body.fromAddress
    const mnemonic = req.body.mnemonic.split(';')[0]
    const toAddress = req.body.toAddress
    const amount = req.body.amount
    const result = await libra.transfer(mnemonic, toAddress, amount)
    const wallet = {
      address: result.address,
      toAddress: toAddress,
      amount: amount
    }
    console.log('wallet', wallet)
    res.send(wallet)

  } catch (error) {
    console.error(error)
    const response = {
      msg: `${error}`
    }
    res.status(500).send(response)
  }
})

// app.post('/transactionHistory', async (req, res) => {
//   try {
//     console.log('req body', req.body)
//     const address = req.body.address

//     // Sent
//     const sentLibra = new LibraDocker()
//     const sentTransactions = await sentLibra.queryTransaction(address, 'sent')

//     // Received
//     const receivedLibra = new LibraDocker()
//     const receivedTransactions = await receivedLibra.queryTransaction(address, 'received')

//     // Merge
//     let transactions = sentTransactions.transactions.concat(receivedTransactions.transactions)
    
//     // Sort by transaction version desc
//     transactions = transactions.sort((a, b) => {
//       return b.transactionVersion - a.transactionVersion
//     })

//     console.log(`query transaction wallet ${address}`)
//     res.send({
//       transactions: transactions
//     })

//   } catch (error) {
//     console.error(error)
//     const response = {
//       msg: `${error}`
//     }
//     res.status(500).send(response)
//   }
// })


app.post('/transactionHistory', async (req, res) => {
  try {
    console.log('req body', req.body)
    const address = req.body.address

    // Sent
    const sentLibra = new LibraService()
    const result = await sentLibra.queryTransactionHistory(address)
    

    console.log(`result ${JSON.stringify(result)}`)
    res.send({
      transactions: result
    })

  } catch (error) {
    console.error(error)
    const response = {
      msg: `${error}`
    }
    res.status(500).send(response)
  }
})

app.post('/mint', async (req, res) => {
  try {
    console.log('req body', req.body)
    const faucent = new Faucent()

    const address = req.body.address
    const amount = req.body.amount
    console.log(`Minting amount ${amount}`)
    if (USE_KULAP_FAUCET) {
      await faucent.getFaucetFromKulap(amount, address)
    } else {
      await faucent.getFaucetFromLibraTestnet(amount, address)
    }

    res.send({
      address: address,
      amount: amount
    })
  } catch (error) {
    console.error(error)
    const response = {
      msg: `${error}`
    }
    res.status(500).send(response)
  }
})

module.exports = app
