Docs
----

- [The First Libra Wallet POC— Building your own Wallet and APIs](https://medium.com/kulapofficial/the-first-libra-wallet-poc-building-your-own-wallet-and-apis-3cb578c0bd52?postPublishedType=repub)

Architect
---------

![Libra Wallet Service Architect](https://cdn-images-1.medium.com/max/1600/1*bpTSkmetebvE-icm_1xuVg.png)
To build that APIs we need shell interactive that can send requests to Libra-cli so we use Node.js with child_process and rauschma/stringio libs to run a Libra-cli container every time when the user makes a request (stateless).

Required
--------

- node 10.15.3
- docker

Install
-------

```shell
# Download source
git clone https://github.com/kulapio/libra-service.git

# Getting in
cd libra-service

# Install dependencies
npm i

# Apply default config
cp .env.example .env
```

Config
------

```
PORT=3000
HOST=localhost
AMOUNT_TO_MINT=100
DOCKER_IMAGE=kulap/libra_client:0.1
USE_KULAP_FAUCET=true
```

Run
---

```shell
npm run start
```

Develop
-------

```shell
npm run dev
```

Test
----

```shell
npm test
```

Warning
-------

- Not production ready.

Endpoints
---------

### Create wallet:

`POST /createWallet`  
Headers: `Content-Typeapplication/json`  
Body: `{}`
  
##### Example Request: 
``` 
curl --location --request POST "https://libraservice2.kulap.io/createWallet" \
  --header "Content-Type: application/json" \
  --data "{}"
```

##### Example Output: 
```json
{
    "address": "5554d60c1af7592673f0ac012ce483b842c06de3d896029cfe957c348621d5b7",
    "balance": "100",
    "mnemonic": "parrot afraid always popular trade grape divide wave dawn web identify kangaroo equal suffer humor creek scan stove hip kingdom skin enable flush announce;1"
}
```

### Get balance:

`POST /getBalance`  
Headers: `Content-Typeapplication/json`  
Body: 

| Key            | Description                                                       | Required   |
| -------------- | ----------------------------------------------------------------- | ---------- |
| `adress`       | Libra's wallet address                                            | yes        |
  
##### Example Request: 
``` 
curl --location --request POST "https://libraservice2.kulap.io/getBalance" \
  --header "Content-Type: application/json" \
  --data "{
	\"address\": \"87b647a009b06483be7a47296b6182294c71eced58837e8043a1f54fdb71d1ee\"
}"
```

##### Example Output: 
```json
{
    "address": "87b647a009b06483be7a47296b6182294c71eced58837e8043a1f54fdb71d1ee",
    "balance": "1000000123"
}
```

### Transfer:

`POST /transfer`  
Headers: `Content-Typeapplication/json`  
Body: 

| Key            | Description                                                       | Required   |
| -------------- | ----------------------------------------------------------------- | ---------- |
| `fromAddress`  | Sender Libra's wallet address                                     | no         |
| `mnemonic`     | Mnemonic phrase                                                   | yes        |
| `toAddress`    | Receiver Libra's wallet address                                   | yes        |
| `amount`       | Amount of Libra coins to transfer                                 | yes        |
  
##### Example Request: 
``` 
curl --location --request POST "https://libraservice2.kulap.io/transfer" \
  --header "Content-Type: application/json" \
  --data "{
	\"fromAddress\": \"3299692e5e635fa2473924177955b3be1e451efc3c03edd212de85c1070a6312\",
	\"mnemonic\": \"shoot brave host cause birth online aerobic hobby east service grow hip thank great fire collect drill elegant appear vote tackle napkin book size;1\",
	\"toAddress\": \"31c7092554bb804a4e25bd24399859428404c28cbc3b44dea5dc2a9f2314144b\",
	\"amount\": \"11\"
}"
```

##### Example Output: 
```json
{
    "address": "3299692e5e635fa2473924177955b3be1e451efc3c03edd212de85c1070a6312",
    "toAddress": "31c7092554bb804a4e25bd24399859428404c28cbc3b44dea5dc2a9f2314144b",
    "amount": "11"
}
```

### Mint:

`POST /mint`  
Headers: `Content-Typeapplication/json`  
Body: 

| Key            | Description                                                       | Required   |
| -------------- | ----------------------------------------------------------------- | ---------- |
| `address`      | Libra's wallet address                                            | yes        |
| `mint`         | Amount of mint coins                                              | yes        |

  
##### Example Request: 
``` 
curl --location --request POST "https://libraservice2.kulap.io/mint" \
  --header "Content-Type: application/json" \
  --data "{
	\"address\": \"f80d5187740a76e3154ec6a24628b40a82040e71e76bdb4c1fac325fcdd73dcc\",
	\"amount\": \"100\"
}"
```

##### Example Output: 
```json
{
    "address": "f80d5187740a76e3154ec6a24628b40a82040e71e76bdb4c1fac325fcdd73dcc",
    "amount": 100
}
```

Postman
-------
[https://documenter.getpostman.com/view/1671913/S1a32SZ5?version=latest](https://documenter.getpostman.com/view/1671913/S1a32SZ5?version=latest)

Contributors
------------

- Tot (Kulap.io, https://github.com/totiz)
- Big (Kulap.io, https://github.com/biigpongsatorn)
- Kor (https://github.com/korrio)
- Bank (https://github.com/zent-bank)
- Suraneti (https://github.com/suraneti)
- Katopz (FoxFox.io, https://github.com/katopz)

License
-------

Libra Service is released under the terms of the MIT license. See [LICENSE](LICENSE) for more
information or see https://opensource.org/licenses/MIT.

Contributing
------------

Contributions are welcome, feel free to fork and pull request.
