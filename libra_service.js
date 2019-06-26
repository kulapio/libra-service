const {streamWrite, streamEnd, onExit, chunksToLinesAsync, chomp} = require('@rauschma/stringio');
const {spawn} = require('child_process');
const shell = require('shelljs');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Libra {
  constructor () {
    // Container
    this.containerName = this.randomContainerName()

    this.userAddress = ''
    this.balance = ''
    this.mnemonic = ''

    // Transfer
    this.toAddress = ''
    this.amountToTransfer = ''
  }

  // Use for random generated container name
  randomContainerName() {
    return 'kulap' + getRandomInt(0, 1000000000).toString(10)
  }

  runLibraCli() {
    const source = spawn('docker', ['run', '--name', this.containerName, '--rm', '-i', 'kulap/libra_client:0.1'],
      {stdio: ['pipe', 'pipe', process.stderr]});
    return source
  }

  async createAccount() {
    const source = this.runLibraCli()
  
    this.createAccountWriteToWritable(source.stdin);
    await this.libraCliReadable(source.stdout);
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
    const source = this.runLibraCli()
    // console.log(source);
  
    this.queryBalanceWriteToWritable(source.stdin);
    await this.libraCliReadable(source.stdout);
    // await onExit(source);
  
    // console.log('### DONE');
    return {
      address: this.userAddress,
      balance: this.balance
    }
  }

  async transfer(fromAddress, mnemonic, toAddress, amount) {
    this.userAddress = fromAddress
    this.mnemonic = mnemonic
    this.toAddress = toAddress
    this.amountToTransfer = amount
    const source = this.runLibraCli()
  
    this.transferWriteToWritable(source.stdin);
    await this.libraCliReadable(source.stdout);
    // await onExit(source);
  
    // console.log('### DONE');
    return {
      address: this.userAddress,
      toAddress: this.toAddress,
      // balance: this.balance, // speed up api by not query balance, use getBalance instead
      amount: this.amountToTransfer
    }
  }
  
  async createAccountWriteToWritable(writable) {
    await sleep(2000)
    await streamWrite(writable, 'account create\n');
    await sleep(1000)
    await streamWrite(writable, 'account mint 0 100\n');
    await sleep(2000)
    // await streamWrite(writable, 'account list\n');
    // await sleep(1000)
    await streamWrite(writable, `query balance 0\n`);
    await sleep(1000)
    // console.log(`writing to /${this.userAddress}`)
    // await streamWrite(writable, `account write /wallet_data/${this.userAddress}\n`);
    await sleep(2000)
    this.mnemonic = shell.exec(`docker exec -i ${this.containerName} cat /client.mnemonic`).stdout.replace('\n', '').replace(';0', ';1'); // :1 to tell libra-cli when loaded later that we have 1 account here
    console.log('mnemonic', this.mnemonic)

    await streamWrite(writable, 'quit\n');
  }

  async queryBalanceWriteToWritable(writable) {
    await sleep(2000)
    await streamWrite(writable, `query balance ${this.userAddress}\n`);
    await sleep(1000)

    await streamWrite(writable, 'quit\n');
  }

  async transferWriteToWritable(writable) {
    await sleep(2000)
    // Save mnemonic to file
    const saveResult = shell.exec(`docker exec -i ${this.containerName} bash -c  "echo '${this.mnemonic}' > /user_mnemonic"`).stdout
    console.log('saveResult', saveResult)

    await streamWrite(writable, 'account recover /user_mnemonic \n');
    await sleep(1000)
    await streamWrite(writable, 'transferb 0 ' + this.toAddress + ' ' + this.amountToTransfer + ' \n');

    await sleep(1000)
    await streamWrite(writable, 'quit\n');
  }
  
  async libraCliReadable(readable) {
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
