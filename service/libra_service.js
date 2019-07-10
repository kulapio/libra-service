const BigNumber = require('bignumber.js')
const {LibraClient, LibraNetwork, Account, LibraWallet } = require('libra-core')

class Libra {
  constructor () {

  }

  async queryBalance(address) {
    const client = new LibraClient({ network: LibraNetwork.Testnet })
  
    const accountState = await client.getAccountState(address)
  
    // balance in micro libras
    const balanceInMicroLibras = BigNumber(accountState.balance.toString())

    const balace = balanceInMicroLibras.dividedBy(BigNumber(1e6))

    return balace.toString(10)
  }

  async createWallet() {
    const client = new LibraClient({ network: LibraNetwork.Testnet })

    // Generate account
    const wallet = new LibraWallet()
    const account = wallet.newAccount()

    return {
      address: account.getAddress().toHex(),
      mnemonic: wallet.config.mnemonic
    }
  }

  async transfer(mnemonic, toAddress, amount) {
    const client = new LibraClient({ network: LibraNetwork.Testnet })
    const wallet = new LibraWallet({
      mnemonic: mnemonic
    })
    const account = wallet.generateAccount(0)
    const account2Address = toAddress

    // Transfer
    const result = await client.transferCoins(account, account2Address, BigNumber(amount).times(1e6))
    
    return {
      result: result,
      address: account.getAddress().toHex()
    }
  }

  async mint(address, amount) {
    const client = new LibraClient({ network: LibraNetwork.Testnet })

    // Mint 100 Libra coins
    const result = await client.mintWithFaucetService(address, BigNumber(amount).times(1e6).toString(10))

    return {
      result: result,
      address: address,
      amount: BigNumber(amount).toString(10)
    }
  }
}


module.exports = Libra
