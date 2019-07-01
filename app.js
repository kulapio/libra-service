const AMOUNT_TO_MINT = process.env.AMOUNT_TO_MINT || 100

const express = require('express')
const bodyParser = require('body-parser')

const Libra = require('./libra_service')
const Faucent = require('./faucet')

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
  console.log('req body', req.body)
  const libra = new Libra()

  let wallet = await libra.createAccount(AMOUNT_TO_MINT)
  console.log('wallet', wallet)
  res.send(wallet)
})

app.post('/getBalance', async (req, res) => {
  console.log('req body', req.body)
  const libra = new Libra()

  let address = req.body.address
  let wallet = await libra.getBalance(address)
  console.log('wallet', wallet)
  res.send(wallet)
})

app.post('/transfer', async (req, res) => {
  console.log('req body', req.body)
  const libra = new Libra()

  let fromAddress = req.body.fromAddress
  let mnemonic = req.body.mnemonic
  let toAddress = req.body.toAddress
  let amount = req.body.amount
  let wallet = await libra.transfer(fromAddress, mnemonic, toAddress, amount)
  console.log('wallet', wallet)
  res.send(wallet)
})

app.post('/transactionHistory', async (req, res) => {
  console.log('req body', req.body)
  const libra = new Libra()

  const address = req.body.address
  const transactions = await libra.queryTransaction(address)
  console.log(`query transaction wallet ${address}`)
  res.send(transactions)
})

app.post('/mint', async (req, res) => {
  try {
    console.log('req body', req.body)
    const faucent = new Faucent()

    const address = req.body.address
    const amount = req.body.amount
    console.log(`Minting amount ${amount}`)
    await faucent.getFaucetFromKulap(amount, address)

    res.send({
      address: address,
      amount: amount
    })
  } catch (error) {
    console.error(error)
  }
})

module.exports = app
