# web3-ssi-rnd-one

An app that makes use of ready-made mobile wallets and interacts with custom backend.

## Goals

This app aims to accomplish:

- Interaction between mobile wallet agent with custom backend wallet agent.
- Issuing of verifiable credential from custom backend wallet agent to mobile wallet agent.
- Revoking of verifiable credential by custom backend wallet agent and reflected on mobile wallet agent.

## Technology used

Mobile wallets used are:

1. Lissi ID wallet by Neosfer GmbH (https://www.lissi.id/for-users)
2. Orbit Edge Wallet by Northen Block (https://northernblock.io/orbit-edge-wallet/)

Tech stack:

- NestJS
- Aries Framework Javascript (AFJ)

_Note_: The custom backend wallet agent uses the Aries Askar package for wallet and storage implementation since the Indy SDK package will be deprecated in the near future. (https://aries.js.org/guides/0.4/getting-started/set-up#adding-a-wallet-and-storage-implementation)
