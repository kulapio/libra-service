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
    10000
  )

  it(
    'should able to get balance',
    async () => {
      const response = await post('/getBalance', {address: 'f4b09c8477cbe3705ac6213ae0af8ec48f8ff0f72285b42fb0ed8f3007e141c5'}).expect(200)
      const { balance } = response.body

      expect(balance).toMatch(/([0-9])/)
    },
    10000
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
      const amountOnCreatedWallet = 100
      await post('/mint', {address: createResponse.body.address, amount: mintingAmount}).expect(200)

      // Transfer
      const response = await post('/transfer', {toAddress: toAddress, mnemonic: createResponse.body.mnemonic, amount: transferAmount}).expect(200)
      console.log('response.body', response.body)
      expect(response.body.toAddress).toMatch(/([a-z0-9])/)
      expect(response.body.amount.toString(10)).toMatch(/([0-9])/)
      expect(response.body.amount.toString(10)).toEqual(transferAmount.toString(10))

      // Balance after
      const balanceAfter = await post('/getBalance', {address: createResponse.body.address}).expect(200)

      // Validate
      expect(parseInt(balanceAfter.body.balance) - amountOnCreatedWallet).toEqual(mintingAmount - transferAmount)
    },
    30000
  )

  // TODO
  it.skip('should able to get transaction history', test.todo)
})
