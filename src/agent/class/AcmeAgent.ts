import type {
  BasicMessageStateChangedEvent,
  ConnectionStateChangedEvent,
  CredentialStateChangedEvent,
  InitConfig,
  OutOfBandRecord,
} from '@aries-framework/core';
import {
  Agent,
  AutoAcceptCredential,
  BasicMessageEventTypes,
  BasicMessageRole,
  ConnectionEventTypes,
  ConnectionsModule,
  ConsoleLogger,
  CredentialEventTypes,
  CredentialsModule,
  DidExchangeState,
  DidsModule,
  KeyType,
  LogLevel,
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
  AnonCredsSchema,
  AnonCredsSchemaRecord,
  GetSchemaReturn,
  LegacyIndyCredentialFormatService,
  RegisterSchemaReturn,
  V1CredentialProtocol,
  getUnqualifiedCredentialDefinitionId,
  parseIndyCredentialDefinitionId,
} from '@aries-framework/anoncreds';
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs';
import { anoncreds } from '@hyperledger/anoncreds-nodejs';
import { BCOVRIN_GENESIS_TRANSACTIONS } from 'src/utils';

interface checkRegisteredSchema_Return {
  schema:
    | AnonCredsSchemaRecord[]
    | GetSchemaReturn
    | RegisterSchemaReturn
    | string;
  type: 'AnonCredsSchemaRecord' | 'GetSchemaReturn' | string;
  flag?: boolean;
}

export class AcmeAgent extends Agent {
  // What you input on bcovrin. Should be kept secure in production!
  private unqualifiedIndyDid = `9VdxM6gJS8tyDzeHxKBd9e`; // will be returned after registering seed on bcovrin
  private indyDid = `did:indy:bcovrin:test:${this.unqualifiedIndyDid}`;

  constructor() {
    const config: InitConfig = {
      label: 'demo-agent-acme',
      walletConfig: {
        id: 'mainAcme',
        key: 'demoagentacme0000000000000000000',
      },
      endpoints: ['https://akmalregov.ngrok.dev'],
      logger: new ConsoleLogger(LogLevel.info),
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
              genesisTransactions: BCOVRIN_GENESIS_TRANSACTIONS,
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
            new V1CredentialProtocol({
              indyCredentialFormat: new LegacyIndyCredentialFormatService(),
            }),
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
        this.registerCredentialDefinition({ schemaResult: schemaResult });
      })
      .catch((e) => {
        console.error(
          `Something went wrong while setting up the Acme agent! Message: ${e}`,
        );
      });
  }
  agentOfferCredential = async (
    connectionId: string,
    credentialDefinitionId: string,
  ) => {
    const parsedCredentialDefinition = parseIndyCredentialDefinitionId(
      credentialDefinitionId,
    );
    const unqualifiedCredentialDefinitionId =
      getUnqualifiedCredentialDefinitionId(
        parsedCredentialDefinition.namespaceIdentifier,
        parsedCredentialDefinition.schemaSeqNo,
        parsedCredentialDefinition.tag,
      );
    const credentialOffer = this.credentials.offerCredential({
      protocolVersion: <never>'v2',
      comment: 'Identity Card',
      connectionId,
      autoAcceptCredential: AutoAcceptCredential.Always,
      credentialFormats: {
        // anoncreds: {
        //   credentialDefinitionId,
        //   attributes: [
        //     { name: 'name', value: 'Jane Doe' },
        //     { name: 'age', value: '23' },
        //   ],
        // },
        indy: {
          credentialDefinitionId: unqualifiedCredentialDefinitionId,
          attributes: [
            { name: 'name', value: 'Jane Doe' },
            { name: 'age', value: '23' },
          ],
        },
      },
    });
    return await credentialOffer;
  };
  registerCredentialDefinition = async (args: {
    schemaResult?: checkRegisteredSchema_Return;
    schemaId?: string;
  }) => {
    if (!args.schemaResult && !args.schemaId) return;
    if (
      (args.schemaResult &&
        args.schemaResult.type === 'AnonCredsSchemaRecord') ||
      args.schemaResult.type === 'GetSchemaReturn'
    )
      return;
    const anonCredsApi = this.modules.anoncreds as AnonCredsApi;
    var schemaId: string;
    if (!args.schemaId) {
      schemaId = (args.schemaResult.schema as RegisterSchemaReturn).schemaState
        .schemaId;
    } else if (!args.schemaResult) {
      schemaId = args.schemaId;
    }
    const credentialDefinitionId =
      await anonCredsApi.getCreatedCredentialDefinitions({
        schemaId: schemaId,
      });

    //check first if credential already exists within local AnonCredsApi
    if (credentialDefinitionId.length > 0) {
      console.log('credential definition already exists!');
      console.log(
        'CredentialDefinitionId is: ',
        credentialDefinitionId[0].credentialDefinitionId,
      );
      return;
    }

    //else if not exist within local AnonCredsApi, register a new credential definition
    const credentialDefinitionResult =
      await anonCredsApi.registerCredentialDefinition({
        credentialDefinition: {
          tag: 'default',
          issuerId: this.indyDid,
          schemaId: schemaId,
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
    console.log('credential definition successfully registered!');
    console.log(
      'CredentialDefinitionId is: ',
      credentialDefinitionResult.credentialDefinitionState
        .credentialDefinitionId,
    );
  };
  checkSchema_LiteralValue = async (anonCredsApi: AnonCredsApi) => {
    var checkSchemaExist = await anonCredsApi.getSchema(
      `did:indy:bcovrin:test:9VdxM6gJS8tyDzeHxKBd9e/anoncreds/v0/SCHEMA/sth/1.0.0`,
    );
    if (checkSchemaExist) {
      console.log('schema already exists!');
      setTimeout(() => console.log('schema is: \n', checkSchemaExist), 2000);
      setTimeout(async () => {
        const credentialDefinition = await anonCredsApi.getCredentialDefinition(
          `did:indy:bcovrin:test:9VdxM6gJS8tyDzeHxKBd9e/anoncreds/v0/CLAIM_DEF/861345/default`,
        );
        console.log(
          'credentialDefinitionId is: \n',
          credentialDefinition.credentialDefinitionId,
        );
        // const credentialDefinitionId =
        //   await anonCredsApi.getCreatedCredentialDefinitions({
        //     schemaId: checkSchemaExist.schemaId,
        //   });
        // if (credentialDefinitionId.length == 0) {
        //   console.log(
        //     'looks like credential definition is not registered with this local AnonCredsApi...',
        //   );
        //   console.log('registering the credential definition...\n');
        //   return this.registerCredentialDefinition({
        //     schemaId: checkSchemaExist.schemaId,
        //   });
        // }
        // console.log(
        //   'credentialDefinitionId is: \n',
        //   credentialDefinitionId[0].credentialDefinitionId,
        // );
      }, 3000);
      return {
        schema: checkSchemaExist,
        type: 'AnonCredsSchemaRecord',
        flag: true,
      };
    }
    return { schema: 'none', type: 'none', flag: false };
  };
  checkSchema_NotLiteralValue = async (
    anonCredsApi: AnonCredsApi,
    schema: AnonCredsSchema,
  ) => {
    var checkSchemaExist = await anonCredsApi.getCreatedSchemas({
      schemaName: schema.name,
    });
    if (checkSchemaExist.length > 0) {
      console.log('schema already exists!');
      setTimeout(() => console.log('schema is: \n', checkSchemaExist[0]), 2000);
      setTimeout(async () => {
        const credentialDefinitionId =
          await anonCredsApi.getCreatedCredentialDefinitions({
            schemaId: checkSchemaExist[0].schemaId,
          });
        console.log(
          'credentialDefinitionId is: \n',
          credentialDefinitionId[0].credentialDefinitionId,
        );
      }, 3000);
      return {
        schema: checkSchemaExist,
        type: 'AnonCredsSchemaRecord',
        flag: true,
      };
    }
    return { schema: 'none', type: 'none', flag: false };
  };
  registerSchema = async () => {
    const anonCredsApi = this.modules.anoncreds as AnonCredsApi;
    const schema: AnonCredsSchema = {
      attrNames: ['name', 'age'],
      issuerId: this.indyDid,
      name: 'sth',
      version: '1.0.0',
    };

    var checkSchema_flag: checkRegisteredSchema_Return = {
      schema: '',
      type: '',
      flag: false,
    };
    checkSchema_flag = await this.checkSchema_LiteralValue(anonCredsApi);
    // checkSchema_flag = await this.checkSchema_NotLiteralValue(
    //   anonCredsApi,
    //   schema,
    // );
    if (checkSchema_flag['flag'])
      return {
        schema: checkSchema_flag['schema'],
        type: checkSchema_flag['type'],
      };

    const schemaResult = await anonCredsApi.registerSchema({
      schema,
      options: {},
    });
    if (schemaResult.schemaState.state === 'failed') {
      throw new Error(
        `Error creating schema: ${schemaResult.schemaState.reason} \
        \n\nA high probability that this schema has already been registered on the ledger!
        `,
      );
    }
    console.log('Schema successfully registered!');
    return { schema: schemaResult, type: 'RegisterSchemaReturn' };
  };
  initialDIDSetup = async () => {
    const seed = TypedArrayEncoder.fromString(
      `akmalregov0000000000000000000000`,
    );

    await this.dids.import({
      did: this.indyDid,
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
        console.log(payload.connectionRecord.state);
        console.log(payload.connectionRecord);
        console.log('\n');
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
  setupCredentialOffered = () => {
    this.events.on<CredentialStateChangedEvent>(
      CredentialEventTypes.CredentialStateChanged,
      async ({ payload }) => {
        console.log(payload.credentialRecord);
      },
    );
  };
}
