const request = require('supertest')
const app = require('../app')
describe('Test service (online)', () => {
  it('should response the GET method', async () =>
    request(app)
      .get('/')
      .expect(200))

  it(
    'should able to create wallet',
    async () =>
      request(app)
        .post('/createWallet')
        .expect(200)
        .then(async response => {
          const { address, balance, mnemonic } = response.body
          expect(address).toMatch(/([a-z0-9])/)
          expect(balance).toMatch(/([0-9])/)
          expect(mnemonic.split(' ').length).toEqual(24)
        }),
    10000
  )

  // TODO
  it.skip('should able to get balance', test.todo)
  it.skip('should able to transfer', test.todo)
  it.skip('should able to get transaction history', test.todo)
  it.skip('should able to mint', test.todo)
})
