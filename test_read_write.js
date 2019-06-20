const {streamWrite, streamEnd, onExit, chunksToLinesAsync, chomp} = require('@rauschma/stringio');
const {spawn} = require('child_process');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
  const source = spawn('cat', [],
    {stdio: ['pipe', 'pipe', process.stderr]}); // (A)

  writeToWritable(source.stdin); // (B)
  await echoReadable(source.stdout); // (B)
  // await onExit(source);

  console.log('### DONE');
}
main();

async function writeToWritable(writable) {
  await streamWrite(writable, 'First line\n');
  await sleep(1000)
  await streamWrite(writable, 'Second line\n');
  await sleep(1000)
  await streamEnd(writable);
}

async function echoReadable(readable) {
  for await (const line of chunksToLinesAsync(readable)) { // (C)
    console.log('LINE: '+chomp(line))
  }
}
