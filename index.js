require('dotenv').config()

const bodyParser = require('body-parser')
const express = require('express')
const Libra = require('./libra_service.js')

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || 'localhost'

const libra = new Libra()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

app.get('/hello', function (req, res) {
  res.send("Hello World!")
})

app.post('/createWallet', async function (req, res) {
  console.log('req body', req.body)
  let wallet = await libra.createAccount()
  console.log('wallet', wallet)
  res.send(wallet)
})

app.post('/getBalance', async function (req, res) {
  console.log('req body', req.body)
  let address = req.body.address
  let wallet = await libra.getBalance(address)
  console.log('wallet', wallet)
  res.send(wallet)
})

app.post('/transfer', async function (req, res) {
  console.log('req body', req.body)
  let fromAddress = req.body.fromAddress
  let mnemonic = req.body.mnemonic
  let toAddress = req.body.toAddress
  let amount = req.body.amount
  let wallet = await libra.transfer(fromAddress, mnemonic, toAddress, amount)
  console.log('wallet', wallet)
  res.send(wallet)
})

app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST} PORT: ${PORT}`)
})
