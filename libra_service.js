const {streamWrite, streamEnd, onExit, chunksToLinesAsync, chomp} = require('@rauschma/stringio');
const {spawn} = require('child_process');
const shell = require('shelljs');
const tmp_wallet_data = '/Users/totiz/wallet_data'

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

class Libra {
  constructor () {
    this.userAddress = ''
    this.balance = ''
    this.mnemonic = ''
  }

  async createAccount() {
    const source = spawn('docker', ['run', '-v', tmp_wallet_data + ':/wallet_data', '--rm', '-i', 'thanandorn/libra_client'],
      {stdio: ['pipe', 'pipe', process.stderr]});
  
    this.createAccountWriteToWritable(source.stdin);
    await this.createAccountReadable(source.stdout);
    // await onExit(source);
  
    // console.log('### DONE');
    return {
      address: this.userAddress,
      balance: this.balance,
      mnemonic: this.mnemonic
    }
  }

  async getBalance(address) {
    this.userAddress = address
    const source = spawn('docker', ['run', '-v', tmp_wallet_data + ':/wallet_data', '--rm', '-i', 'thanandorn/libra_client'],
      {stdio: ['pipe', 'pipe', process.stderr]});
  
    this.queryBalanceWriteToWritable(source.stdin);
    await this.createAccountReadable(source.stdout);
    // await onExit(source);
  
    // console.log('### DONE');
    return {
      address: this.userAddress,
      balance: this.balance
    }
  }
  
  async createAccountWriteToWritable(writable) {
    await sleep(2000)
    await streamWrite(writable, 'account create\n');
    await sleep(1000)
    await streamWrite(writable, 'account mint 0 100\n');
    await sleep(1000)
    // await streamWrite(writable, 'account list\n');
    // await sleep(1000)
    await streamWrite(writable, `query balance 0\n`);
    await sleep(1000)
    console.log(`writing to /wallet_data/${this.userAddress}`)
    await streamWrite(writable, `account write /wallet_data/${this.userAddress}\n`);
    await sleep(2000)
    this.mnemonic = shell.cat(tmp_wallet_data + '/' + this.userAddress).stdout.replace('\n', '')
    console.log('mnemonic', this.mnemonic)


    await streamWrite(writable, 'quit\n');
  }

  async queryBalanceWriteToWritable(writable) {
    await sleep(2000)
    await streamWrite(writable, `query balance ${this.userAddress}\n`);
    await sleep(1000)

    await streamWrite(writable, 'quit\n');
  }
  
  async createAccountReadable(readable) {
    for await (const line of chunksToLinesAsync(readable)) { // (C)
      if (-1 != line.search("Created/retrieved account #0")) {
        this.userAddress = line.split('account #0 address ')[1].replace('\n', '')
        console.log('Your address: ' + this.userAddress)
      } else if (-1 != line.search("Too Many Requests")) {
        console.error('Too Many Requests: ', line)
      } else if (-1 != line.search("Balance is: ")) {
        this.balance = line.split('Balance is: ')[1].replace('\n', '')
        console.log('Your balance: ' + this.balance)
      }
      console.log('LINE: '+chomp(line))
    }
  }  
}

module.exports = Libra
