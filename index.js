var express = require('express');
const bodyParser = require('body-parser');
var app = express();
const PORT = 3000
const Libra = require('./test_libra.js')


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/hello', function(req, res){
   res.send("Hello World!");
});

app.post('/createWallet', async function(req, res){
  console.log('req body', req.body)
  let libra = new Libra()
  let wallet = await libra.createAccount()
  console.log('wallet', wallet)
   res.send(wallet);
});


app.listen(PORT, () => {
  console.log('Server is running on PORT:',PORT);
});
