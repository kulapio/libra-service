require('dotenv').config()
const { streamWrite, streamEnd, onExit, chunksToLinesAsync, chomp } = require('@rauschma/stringio')
const { spawn } = require('child_process')
const { JSDOM } = require("jsdom")
const shell = require('shelljs')
const Faucent = require('./faucet.js')
const USE_KULAP_FAUCET = process.env.USE_KULAP_FAUCET === 'true'

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Libra {
  constructor() {
    // Container
    this.containerName = this.randomContainerName()

    // Minting
    this.amountToMint = 100
    this.faucent = new Faucent()

    this.userAddress = ''
    this.balance = ''
    this.mnemonic = ''

    // Transfer
    this.toAddress = ''
    this.amountToTransfer = ''

    // Transaction
    this.sent_events_count = 0
    this.received_events_count = 0
    this.transactionRaw = []
    this.transactionVersion = []
    this.transactionObject = []
  }

  // Use for random generated container name
  randomContainerName() {
    return 'kulap' + getRandomInt(0, 1000000000).toString(10)
  }

  runLibraCli() {
    const DOCKER_IMAGE = process.env.DOCKER_IMAGE || 'kulap/libra_client:0.1'
    const source = spawn('docker', ['run', '--name', this.containerName, '--rm', '-i', DOCKER_IMAGE],
      { stdio: ['pipe', 'pipe', process.stderr] });
    return source
  }

  async createAccount(amountToMint) {
    this.amountToMint = amountToMint
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

  async queryTransaction(address, event) {
    this.userAddress = address
    const source = this.runLibraCli()

    // serialize sent/received transaction data
    this.queryTransactionWriteToWritable(source.stdin, event)
    await this.libraCliReadableTransaction(source.stdout, event)
    console.log('transactionRaw', this.transactionRaw)

    await this.extractTransactionVersion()
    console.log('transactionVersion', this.transactionVersion)
    await this.serializeDataFromExplorer(event)

    // Sort by transaction version desc
    this.transactionObject = this.transactionObject.sort((a, b) => {
      return b.transactionVersion - a.transactionVersion
    })

    return {
      transactions: this.transactionObject
    }
  }

  async createAccountWriteToWritable(writable) {
    await sleep(2000)
    await streamWrite(writable, 'account create\n');
    await sleep(1000)

    // Use kulap faucet to prevent too may request error
    if (USE_KULAP_FAUCET) {
      await this.faucent.getFaucetFromKulap(this.amountToMint, this.userAddress)
      await sleep(1000)

      // Use libra faucet
    } else {
      await streamWrite(writable, `account mint 0 ${this.amountToMint}\n`);
      await sleep(2000)
    }


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

  async queryTransactionWriteToWritable(writable, event) {
    await sleep(2000)
    await streamWrite(writable, `query account_state ${this.userAddress}\n`)
    await sleep(1000)
    if (event === 'sent') {
      console.log('sent_events_count', this.sent_events_count)
      if (this.sent_events_count > 0) {
        console.log(`query event ${this.userAddress} ${event} ${this.sent_events_count - 1} false 10\n`)
        await streamWrite(writable, `query event ${this.userAddress} ${event} ${this.sent_events_count - 1} false 10\n`)
        await sleep(1000)
      }
    } else {
      if (this.received_events_count > 0) {
        await streamWrite(writable, `query event ${this.userAddress} ${event} ${this.received_events_count - 1} false 10\n`)
        await sleep(1000)
      }
    }

    await streamWrite(writable, 'quit\n')
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
      console.log('LINE: ' + chomp(line))
    }
  }

  async libraCliReadableTransaction(readable) {
    let transaction = []
    let transactionObject = []
    let currentLine = 0
    let splitLine = 0

    for await (const line of chunksToLinesAsync(readable)) {
      // Send event count
      if (-1 != line.search("sent_events_count: ")) {
        this.sent_events_count = parseInt(line.split('sent_events_count: ')[1].replace(',', '').replace('\n', ''))
        console.log('sent_events_count: ' + this.sent_events_count)

      // Received event count
      } else if (-1 != line.search("received_events_count: ")) {
        this.received_events_count = parseInt(line.split('received_events_count: ')[1].replace(',', '').replace('\n', ''))
        console.log('received_events_count: ' + this.received_events_count)

      // If found EventWithProof set splitLine
      } else if (-1 != line.search("EventWithProof {")) {
        splitLine = currentLine + 5
      }

      // Each transaction data has 5 lines, push each line to array
      if (currentLine >= 21 && currentLine <= splitLine) {
        transaction.push(line.toString().replace('EventWithProof', '').trim())
      }

      // Concat array string when currentLine equal splitLine
      if ((currentLine !== 0 && splitLine !== 0) && (currentLine === splitLine)) {
        transactionObject.push(transaction.join(''))
        transaction = []
      }

      // Increase currentLine each loop
      currentLine = currentLine + 1
      console.log(`LINE: ${chomp(line)}`)
    }

    // Convert transaction data (raw string) to json data
    for (let i = 0; i < transactionObject.length; i++) { // (C) totiz  
      let result = await this.convertTransactionResultToJson(transactionObject[i])
      this.transactionRaw.push(JSON.parse(result))
    }
  }

  replaceAll(text, search, replacement) { // (C) totiz  
    return text.split(search).join(replacement)
  }

  convertTransactionResultToJson(transactionString) { // (C) totiz  
    // Remove object name
    let result = transactionString
    result = this.replaceAll(result, 'ContractEvent ', '')
    result = this.replaceAll(result, 'AccessPath ', '')
    result = this.replaceAll(result, 'AccountEvent ', '')
    result = this.replaceAll(result, 'EventProof ', '')
    result = this.replaceAll(result, 'AccumulatorProof ', '')
    result = this.replaceAll(result, 'TransactionInfo ', '')

    // Add string quote to text value
    result = result.replace(/address: ([0-9a-zA-Z]+)/g, 'address: "$1"')
    result = result.replace(/type: ([0-9a-zA-Z]+)/g, 'type: "$1"')
    result = result.replace(/account: ([0-9a-zA-Z]+)/g, 'account: "$1"')
    result = result.replace(/HashValue\(([0-9a-zA-Z]+)\)/g, '"$1"')
    result = this.replaceAll(result, '\\\"', '"')

    // Add string quote to key
    result = result.replace(/([0-9a-zA-Z_]+):/g, '"$1":')

    return result
  }

  extractTransactionVersion() {
    this.transactionRaw.forEach((transaction, index) => {
      this.transactionVersion.push(transaction.transaction_version)
    });

    this.transactionRaw = []
  }

  async serializeDataFromExplorer(event) {
    for await (const version of this.transactionVersion) {
      const url = `https://librabrowser.io/version/${version}`
      console.log('calling ' + url)
      const resp = await JSDOM.fromURL(url)

      const dom = new JSDOM(resp.serialize());
      const tbody = dom.window.document.querySelector('tbody').innerHTML
      const match = tbody.match(/<tr[\s\S]*?<\/tr>/g)

      // transaction version
      // let transactionVersionDom = match[0].split('</td>')
      // transactionVersionDom = transactionVersionDom[1].match(/<td>(.*)/)
      // const transactionVersion = Number(transactionVersionDom[1])

      // expiration time
      let expirationTimeDom = match[1].split('</td>')
      expirationTimeDom = expirationTimeDom[1].match(/<td>(.*)/)
      const expirationTime = expirationTimeDom[1]

      // source address
      let sourceDom = match[2].split('</td>')
      sourceDom = sourceDom[1].match(/<a .*>(.*)<\/a>/)
      const source = sourceDom[1]

      // destination address
      let destinationDom = match[3].split('</td>')
      destinationDom = destinationDom[1].match(/<a .*>(.*)<\/a>/)
      const destination = destinationDom[1]

      // type
      let typeDom = match[4].split('</td>')
      typeDom = typeDom[1].match(/<td>(.*)/)
      const type = typeDom[1]

      // amount transferred
      let amountDom = match[5].split('</td>')
      amountDom = amountDom[1].match(/<td>(.*) Libra/)
      const amount = parseFloat(amountDom[1])

      this.transactionObject.push({
        event: event,
        type: type,
        amount: amount,
        fromAddress: source,
        toAddress: destination,
        date: expirationTime,
        transactionVersion: version,
        explorerLink: `https://librabrowser.io/version/${version}`
      })
    }

    this.transactionVersion = []
  }
}

module.exports = Libra
