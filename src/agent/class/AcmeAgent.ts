import type {
  BasicMessageStateChangedEvent,
  ConnectionStateChangedEvent,
  InitConfig,
  OutOfBandRecord,
} from '@aries-framework/core';
import {
  Agent,
  BasicMessageEventTypes,
  BasicMessageRole,
  ConnectionEventTypes,
  ConnectionsModule,
  CredentialsModule,
  DidExchangeState,
  DidsModule,
  KeyType,
  TypedArrayEncoder,
  V2CredentialProtocol,
} from '@aries-framework/core';
import { agentDependencies } from '@aries-framework/node';
import { AskarModule } from '@aries-framework/askar';
import { ariesAskar } from '@hyperledger/aries-askar-nodejs';
import {
  HttpOutboundTransport,
  WsOutboundTransport,
} from '@aries-framework/core';
import { HttpInboundTransport } from '@aries-framework/node';
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidRegistrar,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
} from '@aries-framework/indy-vdr';
import { indyVdr } from '@hyperledger/indy-vdr-nodejs';
import {
  AnonCredsApi,
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  AnonCredsSchemaRecord,
  LegacyIndyCredentialFormatService,
} from '@aries-framework/anoncreds';
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs';
import { anoncreds } from '@hyperledger/anoncreds-nodejs';

export class AcmeAgent extends Agent {
  constructor() {
    const config: InitConfig = {
      label: 'demo-agent-acme',
      walletConfig: {
        id: 'mainAcme',
        key: 'demoagentacme0000000000000000000',
      },
      endpoints: ['http://localhost:3333'],
    };

    super({
      // A new instance of an agent is created here
      // Askar can also be replaced by the indy-sdk if required
      config,
      modules: {
        askar: new AskarModule({ ariesAskar }),
        anoncredsRs: new AnonCredsRsModule({
          anoncreds,
        }),
        indyVdr: new IndyVdrModule({
          indyVdr,
          networks: [
            {
              isProduction: false,
              indyNamespace: 'bcovrin:test',
              genesisTransactions: `{"reqSignature":{},"txn":{"data":{"data":{"alias":"Node1","blskey":"4N8aUNHSgjQVgkpm8nhNEfDf6txHznoYREg9kirmJrkivgL4oSEimFF6nsQ6M41QvhM2Z33nves5vfSn9n1UwNFJBYtWVnHYMATn76vLuL3zU88KyeAYcHfsih3He6UHcXDxcaecHVz6jhCYz1P2UZn2bDVruL5wXpehgBfBaLKm3Ba","blskey_pop":"RahHYiCvoNCtPTrVtP7nMC5eTYrsUA8WjXbdhNc8debh1agE9bGiJxWBXYNFbnJXoXhWFMvyqhqhRoq737YQemH5ik9oL7R4NTTCz2LEZhkgLJzB3QRQqJyBNyv7acbdHrAT8nQ9UkLbaVL9NBpnWXBTw4LEMePaSHEw66RzPNdAX1","client_ip":"138.197.138.255","client_port":9702,"node_ip":"138.197.138.255","node_port":9701,"services":["VALIDATOR"]},"dest":"Gw6pDLhcBcoQesN72qfotTgFa7cbuqZpkX3Xo6pLhPhv"},"metadata":{"from":"Th7MpTaRZVRYnPiabds81Y"},"type":"0"},"txnMetadata":{"seqNo":1,"txnId":"fea82e10e894419fe2bea7d96296a6d46f50f93f9eeda954ec461b2ed2950b62"},"ver":"1"}
              {"reqSignature":{},"txn":{"data":{"data":{"alias":"Node2","blskey":"37rAPpXVoxzKhz7d9gkUe52XuXryuLXoM6P6LbWDB7LSbG62Lsb33sfG7zqS8TK1MXwuCHj1FKNzVpsnafmqLG1vXN88rt38mNFs9TENzm4QHdBzsvCuoBnPH7rpYYDo9DZNJePaDvRvqJKByCabubJz3XXKbEeshzpz4Ma5QYpJqjk","blskey_pop":"Qr658mWZ2YC8JXGXwMDQTzuZCWF7NK9EwxphGmcBvCh6ybUuLxbG65nsX4JvD4SPNtkJ2w9ug1yLTj6fgmuDg41TgECXjLCij3RMsV8CwewBVgVN67wsA45DFWvqvLtu4rjNnE9JbdFTc1Z4WCPA3Xan44K1HoHAq9EVeaRYs8zoF5","client_ip":"138.197.138.255","client_port":9704,"node_ip":"138.197.138.255","node_port":9703,"services":["VALIDATOR"]},"dest":"8ECVSk179mjsjKRLWiQtssMLgp6EPhWXtaYyStWPSGAb"},"metadata":{"from":"EbP4aYNeTHL6q385GuVpRV"},"type":"0"},"txnMetadata":{"seqNo":2,"txnId":"1ac8aece2a18ced660fef8694b61aac3af08ba875ce3026a160acbc3a3af35fc"},"ver":"1"}
              {"reqSignature":{},"txn":{"data":{"data":{"alias":"Node3","blskey":"3WFpdbg7C5cnLYZwFZevJqhubkFALBfCBBok15GdrKMUhUjGsk3jV6QKj6MZgEubF7oqCafxNdkm7eswgA4sdKTRc82tLGzZBd6vNqU8dupzup6uYUf32KTHTPQbuUM8Yk4QFXjEf2Usu2TJcNkdgpyeUSX42u5LqdDDpNSWUK5deC5","blskey_pop":"QwDeb2CkNSx6r8QC8vGQK3GRv7Yndn84TGNijX8YXHPiagXajyfTjoR87rXUu4G4QLk2cF8NNyqWiYMus1623dELWwx57rLCFqGh7N4ZRbGDRP4fnVcaKg1BcUxQ866Ven4gw8y4N56S5HzxXNBZtLYmhGHvDtk6PFkFwCvxYrNYjh","client_ip":"138.197.138.255","client_port":9706,"node_ip":"138.197.138.255","node_port":9705,"services":["VALIDATOR"]},"dest":"DKVxG2fXXTU8yT5N7hGEbXB3dfdAnYv1JczDUHpmDxya"},"metadata":{"from":"4cU41vWW82ArfxJxHkzXPG"},"type":"0"},"txnMetadata":{"seqNo":3,"txnId":"7e9f355dffa78ed24668f0e0e369fd8c224076571c51e2ea8be5f26479edebe4"},"ver":"1"}
              {"reqSignature":{},"txn":{"data":{"data":{"alias":"Node4","blskey":"2zN3bHM1m4rLz54MJHYSwvqzPchYp8jkHswveCLAEJVcX6Mm1wHQD1SkPYMzUDTZvWvhuE6VNAkK3KxVeEmsanSmvjVkReDeBEMxeDaayjcZjFGPydyey1qxBHmTvAnBKoPydvuTAqx5f7YNNRAdeLmUi99gERUU7TD8KfAa6MpQ9bw","blskey_pop":"RPLagxaR5xdimFzwmzYnz4ZhWtYQEj8iR5ZU53T2gitPCyCHQneUn2Huc4oeLd2B2HzkGnjAff4hWTJT6C7qHYB1Mv2wU5iHHGFWkhnTX9WsEAbunJCV2qcaXScKj4tTfvdDKfLiVuU2av6hbsMztirRze7LvYBkRHV3tGwyCptsrP","client_ip":"138.197.138.255","client_port":9708,"node_ip":"138.197.138.255","node_port":9707,"services":["VALIDATOR"]},"dest":"4PS3EDQ3dW1tci1Bp6543CfuuebjFrg36kLAUcskGfaA"},"metadata":{"from":"TWwCRQRZ2ZHMJFn9TzLp7W"},"type":"0"},"txnMetadata":{"seqNo":4,"txnId":"aa5e817d7cc626170eca175822029339a444eb0ee8f0bd20d3b0b76e566fb008"},"ver":"1"}`,
              connectOnStartup: true,
            },
          ],
        }),
        anoncreds: new AnonCredsModule({
          registries: [new IndyVdrAnonCredsRegistry()],
        }),
        dids: new DidsModule({
          registrars: [new IndyVdrIndyDidRegistrar()],
          resolvers: [new IndyVdrIndyDidResolver()],
        }),
        credentials: new CredentialsModule({
          credentialProtocols: [
            new V2CredentialProtocol({
              credentialFormats: [
                new LegacyIndyCredentialFormatService(),
                new AnonCredsCredentialFormatService(),
              ],
            }),
          ],
        }),
        connections: new ConnectionsModule({ autoAcceptConnections: true }),
      },
      dependencies: agentDependencies,
    });
    this.registerOutboundTransport(new WsOutboundTransport());
    this.registerOutboundTransport(new HttpOutboundTransport());
    this.registerInboundTransport(new HttpInboundTransport({ port: 3333 }));
    this.initialize()
      .then(() => {
        console.log('Acme Agent initialized!');
      })
      .then(this.initialDIDSetup)
      .then(async () => {
        const schemaResult = await this.registerSchema();
        this.registerCredentialDefinition(schemaResult);
      })
      .catch((e) => {
        console.error(
          `Something went wrong while setting up the Acme agent! Message: ${e}`,
        );
      });
  }
  offerCredential = async () => {
    const anonCredsCredentialExchangeRecord =
      this.modules.credentials.offerCredential({
        protocolVersion: 'v2',
        connectionId: '<connection id>',
        credentialFormats: {
          anoncreds: {
            credentialDefinitionId: '<credential definition id>',
            attributes: [
              { name: 'name', value: 'Jane Doe' },
              { name: 'age', value: '23' },
            ],
          },
        },
      });
    return anonCredsCredentialExchangeRecord;
  };
  registerCredentialDefinition = async (schemaResult: any) => {
    if (schemaResult.type === 'AnonCredsSchemaRecord') return;
    const unqualifiedIndyDid = `9VdxM6gJS8tyDzeHxKBd9e`; // will be returned after registering seed on bcovrin
    const indyDid = `did:indy:bcovrin:test:${unqualifiedIndyDid}`;
    const credentialDefinitionResult =
      await this.modules.anoncreds.registerCredentialDefinition({
        credentialDefinition: {
          tag: 'default',
          issuerId: indyDid,
          schemaId: schemaResult.schemaState.schemaId,
        },
        options: {},
      });

    if (
      credentialDefinitionResult.credentialDefinitionState.state === 'failed'
    ) {
      throw new Error(
        `Error creating credential definition: ${credentialDefinitionResult.credentialDefinitionState.reason}`,
      );
    }
  };
  registerSchema = async () => {
    const unqualifiedIndyDid = `9VdxM6gJS8tyDzeHxKBd9e`; // will be returned after registering seed on bcovrin
    const indyDid = `did:indy:bcovrin:test:${unqualifiedIndyDid}`;
    const anonCredsApi = this.modules.anoncreds as AnonCredsApi;
    const schema = {
      attrNames: ['name', 'age'],
      issuerId: indyDid,
      name: 'sth',
      version: '1.0.0',
    };
    var checkSchemaExist = await anonCredsApi.getCreatedSchemas({
      schemaName: schema.name,
    });
    if (checkSchemaExist) {
      console.log('schema already exists!');
      console.log('schema is: \n', checkSchemaExist[0]);
      return { schema: checkSchemaExist[0], type: 'AnonCredsSchemaRecord' };
    }
    const schemaResult = await anonCredsApi.registerSchema({
      schema,
      options: {},
    });
    if (schemaResult.schemaState.state === 'failed') {
      throw new Error(
        `Error creating schema: ${schemaResult.schemaState.reason}`,
      );
    }
    return { schema: schemaResult, type: 'RegisterSchemaReturn' };
  };
  initialDIDSetup = async () => {
    const seed = TypedArrayEncoder.fromString(
      `akmalregov0000000000000000000000`,
    ); // What you input on bcovrin. Should be kept secure in production!
    const unqualifiedIndyDid = `9VdxM6gJS8tyDzeHxKBd9e`; // will be returned after registering seed on bcovrin
    const indyDid = `did:indy:bcovrin:test:${unqualifiedIndyDid}`;

    await this.dids.import({
      did: indyDid,
      overwrite: true,
      privateKeys: [
        {
          privateKey: seed,
          keyType: KeyType.Ed25519,
        },
      ],
    });
  };
  setupConnectionListener = (
    outOfBandRecord: OutOfBandRecord,
    cb?: (...args: any) => void,
  ) => {
    this.events.on<ConnectionStateChangedEvent>(
      ConnectionEventTypes.ConnectionStateChanged,
      ({ payload }) => {
        if (!outOfBandRecord) return;
        if (payload.connectionRecord.outOfBandId !== outOfBandRecord.id) return;
        if (payload.connectionRecord.state === DidExchangeState.Completed) {
          // the connection is now ready for usage in other protocols!
          console.log(
            `Acme Agent, Connection for out-of-band id ${outOfBandRecord.id} completed`,
          );
          console.log(
            `Acme Agent, ConnectionId is: `,
            payload.connectionRecord.id,
          );

          // Custom business logic can be included here
          // In this example we can send a basic message to the connection, but
          // anything is possible
          if (cb) cb();

          // We exit the flow
          // process.exit(0);
        }
      },
    );
  };
  setupMessageListener = (cb?: (...args: any) => void) => {
    this.events.on<BasicMessageStateChangedEvent>(
      BasicMessageEventTypes.BasicMessageStateChanged,
      async ({ payload }) => {
        if (payload.basicMessageRecord.role === BasicMessageRole.Sender) {
          console.log(`Acme sent a message: ${payload.message.content}`);
          // Custom business logic can be included here
          // In this example we can send a basic message to the connection, but
          // anything is possible
          if (cb) cb();
        }
        if (payload.basicMessageRecord.role === BasicMessageRole.Receiver) {
          console.log(`Acme received a message: ${payload.message.content}`);
        }
      },
    );
  };
}
