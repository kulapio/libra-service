require('dotenv').config()
const AMOUNT_TO_MINT = process.env.AMOUNT_TO_MINT || 100

const request = require('supertest')
const app = require('../app')

// a helper function to make a POST request
function post(url, body=undefined){
  const httpRequest = request(app).post(url);
  if (body != undefined) {
    httpRequest.send(body)
    httpRequest.set('Accept', 'application/json')
  }
  return httpRequest;
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

describe('Test service (online)', () => {
  it('should response the GET method', async () =>
    request(app)
      .get('/')
      .expect(200))

  it(
    'should able to create wallet',
    async () => {
      const response = await post('/createWallet').expect(200)
      const { address, balance, mnemonic } = response.body

      expect(address).toMatch(/([a-z0-9])/)
      expect(balance).toMatch(/([0-9])/)
      expect(mnemonic.split(' ').length).toEqual(24)
    },
    20000
  )

  it(
    'should able to get balance',
    async () => {
      const response = await post('/getBalance', {address: 'f4b09c8477cbe3705ac6213ae0af8ec48f8ff0f72285b42fb0ed8f3007e141c5'}).expect(200)
      const { balance } = response.body

      expect(balance).toMatch(/([0-9])/)
    },
    20000
  )

  it(
    'should able to mint',
    async () => {
      const address = 'be53f459ac833fccdd5a6b7b5835350e18aa6c3b31e5e51a592a56b660a1f0ac'
      const mintingAmount = 1000

      // Balance before
      const balanceBefore = await post('/getBalance', {address: address}).expect(200)

      // Mint
      const response = await post('/mint', {address: address, amount: mintingAmount}).expect(200)
      expect(response.body.address).toMatch(/([a-z0-9])/)
      expect(response.body.amount.toString(10)).toMatch(/([0-9])/)

      await sleep(500)

      // Balance after
      const balanceAfter = await post('/getBalance', {address: address}).expect(200)

      // Validate
      expect(parseInt(balanceAfter.body.balance)).toEqual(parseInt(balanceBefore.body.balance) + mintingAmount)
    },
    20000
  )

  it(
    'should able to transfer',
    async () => {
      const toAddress = 'be53f459ac833fccdd5a6b7b5835350e18aa6c3b31e5e51a592a56b660a1f0ac'
      const mintingAmount = 1500
      const transferAmount = 1000

      // Create wallet
      const createResponse = await post('/createWallet').expect(200)

      // Mint with 100 coins
      const amountOnCreatedWallet = AMOUNT_TO_MINT
      await post('/mint', {address: createResponse.body.address, amount: mintingAmount}).expect(200)

      // Transfer
      const response = await post('/transfer', {toAddress: toAddress, mnemonic: createResponse.body.mnemonic, amount: transferAmount}).expect(200)
      console.log('response.body', response.body)
      expect(response.body.toAddress).toMatch(/([a-z0-9])/)
      expect(response.body.amount.toString(10)).toMatch(/([0-9])/)
      expect(response.body.amount.toString(10)).toEqual(transferAmount.toString(10))

      await sleep(500)

      // Balance after
      const balanceAfter = await post('/getBalance', {address: createResponse.body.address}).expect(200)

      // Validate
      expect(parseInt(balanceAfter.body.balance) - amountOnCreatedWallet).toEqual(mintingAmount - transferAmount)
    },
    30000
  )

  it(
    'should able to get transaction history',
    async () => {
      // Create wallet
      const walletA = await post('/createWallet').expect(200)
      console.log('walletA', walletA.body)
      const walletB = await post('/createWallet').expect(200)
      console.log('walletB', walletA.body)

      // Transfer A -> B 25 coins
      await post('/transfer', {toAddress: walletB.body.address, mnemonic: walletA.body.mnemonic, amount: 25}).expect(200)
      console.log('tx 1')
      await sleep(500)

      // Transfer B -> A 57 coins
      await post('/transfer', {toAddress: walletA.body.address, mnemonic: walletB.body.mnemonic, amount: 57}).expect(200)
      console.log('tx 2')
      await sleep(500)

      // Transfer A -> B 10 coins
      await post('/transfer', {toAddress: walletB.body.address, mnemonic: walletA.body.mnemonic, amount: 10}).expect(200)
      console.log('tx 3')
      await sleep(500)

      // Get transaction history
      const response = await post('/transactionHistory', {address: walletA.body.address}).expect(200)
      const { transactions } = response.body

      // Validate
      // tx 0
      expect(transactions[0].type).toEqual('peer_to_peer_transaction')
      expect(transactions[0].event).toEqual('sent')
      expect(transactions[0].fromAddress).toEqual(walletA.body.address)
      expect(transactions[0].toAddress).toEqual(walletB.body.address)
      expect(transactions[0].amount).toEqual("10")
      expect(transactions[0].transactionVersion.toString(10)).toMatch(/([0-9])/)

      // tx 1
      expect(transactions[1].type).toEqual('peer_to_peer_transaction')
      expect(transactions[1].event).toEqual('received')
      expect(transactions[1].fromAddress).toEqual(walletB.body.address)
      expect(transactions[1].toAddress).toEqual(walletA.body.address)
      expect(transactions[1].amount).toEqual("57")
      expect(transactions[1].transactionVersion.toString(10)).toMatch(/([0-9])/)

      // tx 2
      expect(transactions[2].type).toEqual('peer_to_peer_transaction')
      expect(transactions[2].event).toEqual('sent')
      expect(transactions[2].fromAddress).toEqual(walletA.body.address)
      expect(transactions[2].toAddress).toEqual(walletB.body.address)
      expect(transactions[2].amount).toEqual("25")
      expect(transactions[2].transactionVersion.toString(10)).toMatch(/([0-9])/)

    },
    120000
  )
})
