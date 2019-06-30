# Docs
- [The First Libra Wallet POC— Building your own Wallet and APIs](https://medium.com/kulapofficial/the-first-libra-wallet-poc-building-your-own-wallet-and-apis-3cb578c0bd52?postPublishedType=repub)

# Architect
![Libra Wallet Service Architect](https://cdn-images-1.medium.com/max/1600/1*bpTSkmetebvE-icm_1xuVg.png)
To build that APIs we need shell interactive that can send requests to Libra-cli so we use Node.js with child_process and rauschma/stringio libs to run a Libra-cli container every time when the user makes a request (stateless).


# Required
- node 10.15.3
- docker

# Install
npm install

# Run
npm run start

or

node index.js

# Config
- Open .evn
```
PORT=3000
HOST=localhost
AMOUNT_TO_MINT=100
DOCKER_IMAGE=kulap/libra_client:0.1
```

# Endpoints
Create Wallet:

`POST /createWallet`  
Headers: `Content-Typeapplication/json`  
Body: `{}`
  
Example Request: 
``` 
curl --location --request POST "https://libraservice2.kulap.io/createWallet" \
  --header "Content-Type: application/json" \
  --data "{}"
```

# Contributors
- Tot (Kulap.io, https://github.com/totiz)
- Big (Kulap.io, https://github.com/biigpongsatorn)
- Kor (https://github.com/korrio)
- Bank (https://github.com/zent-bank)
- Suraneti (https://github.com/suraneti)
