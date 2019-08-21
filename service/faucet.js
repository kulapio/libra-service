const axios = require('axios')
const BigNumber = require('bignumber.js')

class Faucet {
  async getFaucetFromLibraTestnet(amount, address) {
    // Convert to micro libras
    const amountInMicro = BigNumber(amount).times(1e6)
    const url = `http://faucet.testnet.libra.org?amount=${amountInMicro.toString(10)}&address=${address}`
    console.log(`calling faucet ${url}`)

    const response = await axios.post(url)
    return response
  }

  async getFaucetFromKulap(amount, address) {
    const payload = { amount: amount, address: address }
    const url = `https://libraservice3.kulap.io/mint`
    console.log(`calling faucet ${url}`)

    const response = await axios.post(url, payload)
    return response
  }
}

module.exports = Faucet
