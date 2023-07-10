# web3-ssi-rnd-one

An app that makes use of ready-made mobile wallets and interacts with custom backend.
Its primarily built and designed around the concept of self-sovereign identity where verifiable credential holders fully control the privacy and sharing of the credential once received from issuers and verifiers accept credentials issued based on trust towards the issuers.

## Goals

This app aims to accomplish:

- Interaction between mobile wallet agent with custom backend wallet agent.
- Issuing of verifiable credential from custom backend wallet agent to mobile wallet agent.
- Revoking of verifiable credential by custom backend wallet agent and reflected on mobile wallet agent. (Postponed)
- Integration with Postgres for credential storage for issuer and especially for holder.

## Technology used

Mobile wallets used are:

1. Lissi ID wallet by Neosfer GmbH (https://www.lissi.id/for-users)
2. Orbit Edge Wallet by Northern Block (https://northernblock.io/orbit-edge-wallet/)

_NOTE_: Lissi wallet is by far the most problematic and would not be recommended to use for this.

Tech stack:

- NestJS
- Aries Framework Javascript (AFJ)

_NOTE_: The custom backend wallet agent uses the Aries Askar package for wallet and storage implementation since the Indy SDK package will be deprecated in the near future. (https://aries.js.org/guides/0.4/getting-started/set-up#adding-a-wallet-and-storage-implementation)

## How to run the code (should be really helpful)

### Schema and Credential Definition registration and errors
The registration and usage of the Schema and Credential Definition is quite tricky mainly because of these reasons stated in [AFJ 0.3.0 Side Notes](https://aries.js.org/guides/0.3/tutorials/issue-a-credential#side-notes), which are:
1. When attempting to register a credential definition that already exists on the ledger but is not in your wallet, AFJ will throw an error (as opposed to returning the credential definition from the ledger in prior versions)
2. Attempting to register a new credential definition that is already in the wallet in AFJ will return the stored definition without attempting to register it on the ledger.
> These choices are intentional. In case 1, it is assumed that this workflow is a mistake. In case 2, it is assumed that having registered the credential on the ledger is implied.

Hence for troubleshooting purposes:
1. If using Docker and local changes are not persisted (through shutdown of docker app or PC), you **MUST** register the Schema and Credential Definition similar to how you would do it for the first time.
 - You _cannot reuse_ any registered Schema AND/OR Credential Definition that are not created, stored and persisted locally in your machine AND/OR container. Hence, the problem with using Docker for this.
2. If you get an error when registering the Schema, usually it is because the Schema has already been registered in the ledger (but maybe not locally stored in your machine AND/OR container.)
3. Make sure **to not create more than one Credential Definition in your machine AND/OR container**, else there would a problem when issuing credentials!
 - If you did create more than one credential definition, registering a new schema and ONLY 1 new credential definition for that would solve the problem.
4. For now, there is no guaranteed way to check if Schema and Credential Definition have been registered within your local machine AND/OR container, without through trial and error testing.
 - AnonCredsApi methods to check registration of Schema and Credential Definition exist but that searches only within your local machine AND/OR container, hence if local cache and changes are not persisted, you need to register new ones.
 - 2 methods in AcmeAgent.ts to check registered Schema are checkSchema_LiteralValue and checkSchema_NotLiteralValue.
  - checkSchema_LiteralValue is a method where you want to check if your previous registered schema (registered elsewhere on other machine AND/OR container) exist within the ledger (but it does not check within your local machine AND/OR container).
  - checkSchema_NotLiteralValue is a method where you want to check if the schema is registered after your first run of the registration. **This method invocation should be commented out IF you are doing the first time registration for the schema and credential definition.**

### Ngrok usage
Ngrok is used to expose the localhost of the issuer to the recipient agent. Make sure it is up and running.
- To start ngrok on static domain (Make sure to use your own ngrok account and domain)
  ``` shell 
  ngrok http --hostname=akmalregov.ngrok.dev 3333 (Mac/Linux) 
  ```
  ```shell 
  ngrok http --domain=akmalregov.ngrok.dev 3333 (Windows) 
  ```

### Connection establishment and Connection ID
1. By making a HTTP get request that creates the agent invitation, it should also generate a QR code within the root project directory.
2. Use the qr code generated, located in the root project directory by scanning it with an Aries agent mobile wallet/app.
3. Once connection is established, make sure to save the Connection ID logged by the console and used that in the credential issuance request
along with Credential Definition ID.
