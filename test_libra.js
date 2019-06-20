const {streamWrite, streamEnd, onExit, chunksToLinesAsync, chomp} = require('@rauschma/stringio');
const {spawn} = require('child_process');
const walelt_path = '/Users/totiz/Desktop/libra_wallet'


const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

class Libra {
  constructor () {
    this.userAddress = ''
    this.balance = ''
  }

  async createAccount() {
    const source = spawn('docker', ['run', '-v' , walelt_path + ':/wallet', '--rm', '-i', 'thanandorn/libra_client'],
      {stdio: ['pipe', 'pipe', process.stderr]});
  
    this.createAccountWriteToWritable(source.stdin);
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
    await streamWrite(writable, 'account list\n');
    await sleep(1000)
    await streamWrite(writable, `query balance 0\n`);
    await sleep(1000)
    await streamWrite(writable, 'quit\n');
    // await streamWrite(writable, 'First line\n');
    // await sleep(1000)
    // await streamWrite(writable, 'Second line\n');
    // await sleep(1000)
    // await streamEnd(writable);
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



(async () => {
  try {
    let libra = new Libra()
    let wallet = await libra.createAccount()
    console.log('wallet', wallet)

  } catch (error) {
    logger.error(error)
  }
})()
