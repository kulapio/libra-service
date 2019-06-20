const {streamWrite, streamEnd, onExit} = require('@rauschma/stringio');
const {spawn} = require('child_process');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
  const sink = spawn('cat', [],
    {stdio: ['pipe', process.stdout, process.stderr]}); // (A)

  writeToWritable(sink.stdin); // (B)
  await onExit(sink);

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

