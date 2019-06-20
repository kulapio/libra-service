const {chunksToLinesAsync, chomp} = require('@rauschma/stringio');
const {spawn} = require('child_process');

async function main() {
  const filePath = process.argv[2];
  console.log('INPUT: '+filePath);

  const source = spawn('cat', [filePath],
    {stdio: ['ignore', 'pipe', process.stderr]}); // (A)

  await echoReadable(source.stdout); // (B)

  console.log('### DONE');
}
main();

async function echoReadable(readable) {
  for await (const line of chunksToLinesAsync(readable)) { // (C)
    console.log('LINE: '+chomp(line))
  }
}