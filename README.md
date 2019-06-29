# Docs

- [The First Libra Wallet POC— Building your own Wallet and APIs](https://medium.com/kulapofficial/the-first-libra-wallet-poc-building-your-own-wallet-and-apis-3cb578c0bd52?postPublishedType=repub)

# Architect

![Libra Wallet Service Architect](https://cdn-images-1.medium.com/max/1600/1*bpTSkmetebvE-icm_1xuVg.png)
To build that APIs we need shell interactive that can send requests to Libra-cli so we use Node.js with child_process and rauschma/stringio libs to run a Libra-cli container every time when the user makes a request (stateless).

# Required

- node 10.15.3
- docker

# Install

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

# Config

```
PORT=3000
HOST=localhost
AMOUNT_TO_MINT=100
DOCKER_IMAGE=kulap/libra_client:0.1
USE_KULAP_FAUCET=true
```

# Run

```shell
npm run start
```

# Develop

```shell
npm run dev
```

# Test

```shell
npm test
```

# Warning

- Not production ready.

# Contributors

- Tot (Kulap.io, https://github.com/totiz)
- Big (Kulap.io, https://github.com/biigpongsatorn)
- Kor (https://github.com/korrio)
- Bank (https://github.com/zent-bank)
- Suraneti (https://github.com/suraneti)
- Katopz (FoxFox.io, https://github.com/katopz)
