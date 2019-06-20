const {streamWrite, streamEnd, onExit, chunksToLinesAsync, chomp} = require('@rauschma/stringio');
const {spawn} = require('child_process');
const walelt_path = '/Users/totiz/Desktop/libra_wallet'


const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
  // /Users/totiz/libra
  // /Users/totiz/Desktop/testjs
  // docker run --rm -it thanandorn/libra_client
  // const source = spawn('/Users/totiz/libra/scripts/cli/start_cli_testnet.sh', [],
  const source = spawn('docker', ['run', '-v' , walelt_path + ':/wallet', '--rm', '-i', 'thanandorn/libra_client'],
    {stdio: ['pipe', 'pipe', process.stderr]}); // (A)

  writeToWritable(source.stdin); // (B)
  await echoReadable(source.stdout); // (B)
  // await onExit(source);

  console.log('### DONE');
}
main();

async function writeToWritable(writable) {
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

async function echoReadable(readable) {
  for await (const line of chunksToLinesAsync(readable)) { // (C)
    if (-1 != line.search("Created/retrieved account #0")) {
      let address = line.split('account #0 address ')[1]
      console.log('Your address: ' + address)
    } else if (-1 != line.search("Too Many Requests")) {
      console.error('Too Many Requests: ', line)
    }
    console.log('LINE: '+chomp(line))
  }
}

