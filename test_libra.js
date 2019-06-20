const Libra = require('./libra_service.js')

async function main() {
  console.log('hi')
  let libra = new Libra()
  let wallet = await libra.createAccount()
  console.log('wallet', wallet)
}

main()