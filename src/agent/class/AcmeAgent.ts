import type {
  BasicMessageStateChangedEvent,
  ConnectionStateChangedEvent,
  CredentialStateChangedEvent,
  InitConfig,
  OutOfBandRecord,
  ProofStateChangedEvent,
} from '@aries-framework/core';
import {
  Agent,
  AutoAcceptCredential,
  AutoAcceptProof,
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
  ProofEventTypes,
  ProofState,
  ProofsModule,
  TypedArrayEncoder,
  V2CredentialProtocol,
  V2ProofProtocol,
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
  AnonCredsProofFormatService,
  AnonCredsSchema,
  GetSchemaReturn,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  RegisterSchemaReturn,
  V1CredentialProtocol,
  getUnqualifiedCredentialDefinitionId,
  parseIndyCredentialDefinitionId,
} from '@aries-framework/anoncreds';
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs';
import { anoncreds } from '@hyperledger/anoncreds-nodejs';
import { BCOVRIN_GENESIS_TRANSACTIONS } from 'src/utils';
import { Schema } from 'src/schema/dto';
import { httpErrorException_Return } from '../agent.service';

interface checkRegisteredSchema_Return {
  schema: GetSchemaReturn | RegisterSchemaReturn | string;
  type: 'GetSchemaReturn' | string;
  flag?: boolean;
}

export class AcmeAgent extends Agent {
  // What you input on bcovrin. Should be kept secure in production!
  private unqualifiedIndyDid1 = `9VdxM6gJS8tyDzeHxKBd9e`; // will be returned after registering seed on bcovrin
  private unqualifiedIndyDid2 = `RoDtMA1rkAKVLcXv7iibAk`; // will be returned after registering seed on bcovrin
  private indyDid = `did:indy:bcovrin:test:${this.unqualifiedIndyDid1}`;
  private schemaID = '';

  constructor() {
    const storageConfig = {
      type: 'postgres',
      config: {
        //for docker usage
        host: 'issuer-postgres:5432',
        //for local usage
        // host: 'localhost:5432',
      },
      credentials: {
        account: 'postgres',
        password: 'postgres',
        admin_account: 'postgres',
        admin_password: 'postgres',
      },
    };
    const config: InitConfig = {
      label: 'demo-agent-acme',
      walletConfig: {
        id: 'mainAcme',
        key: 'demoagentacme0000000000000000000',
        // storage: storageConfig,
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
        proofs: new ProofsModule({
          autoAcceptProofs: AutoAcceptProof.ContentApproved,
          proofProtocols: [
            new V2ProofProtocol({
              proofFormats: [
                new AnonCredsProofFormatService(),
                new LegacyIndyProofFormatService(),
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
        console.log(
          'Acme Agent wallet storage database is: ',
          this.agentConfig.walletConfig.storage,
        );
      })
      .then(this.initialDIDSetup)
      .then(async () => {
        // const schemaResult = await this.registerSchema();
        // this.registerCredentialDefinition(schemaResult);
      })
      .then(async () => {
        console.log(
          'Acme agent listening for proof requests that they have sent...',
        );
        this.setupProofRequested();
      })
      .catch((e) => {
        console.error(
          `Something went wrong while setting up the Acme agent! Message: ${e}`,
        );
      });
  }
  agentRequestProof = async (
    connectionId: string,
    proofFormat: {
      [name: string]: {
        name: string;
        version: string;
        requested_attributes: {
          [name: string]: {
            name: string;
            restrictions: {
              cred_def_id: string;
            }[];
          };
        };
        requested_predicates?: {
          [name: string]: {
            name: string;
            p_type: string;
            p_value: number;
            restrictions: {
              cred_def_id: string;
            }[];
          };
        };
      };
    },
  ) => {
    console.log('Requesting proof with the following formats:\n');
    console.dir(proofFormat, { depth: null, colors: true });
    const proofRequest = this.proofs.requestProof({
      connectionId: connectionId,
      protocolVersion: 'v2',
      proofFormats: proofFormat,
    });
    return await proofRequest;
  };
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
        anoncreds: {
          credentialDefinitionId,
          attributes: [
            { name: 'name', value: 'Jane Doe' },
            { name: 'age', value: '23' },
          ],
        },
        // indy: {
        //   credentialDefinitionId: unqualifiedCredentialDefinitionId,
        //   attributes: [
        //     { name: 'name', value: 'Jane Doe' },
        //     { name: 'age', value: '23' },
        //   ],
        // },
      },
    });
    return await credentialOffer;
  };
  registerCredentialDefinition = async (
    args: checkRegisteredSchema_Return | string,
  ) => {
    if (typeof args !== 'object' && typeof args !== 'string') return;
    if (typeof args === 'object' && args.type === 'GetSchemaReturn') return;
    const anonCredsApi = this.modules.anoncreds as AnonCredsApi;
    var schemaId: string;
    if (typeof args !== 'string') {
      schemaId = (args.schema as RegisterSchemaReturn).schemaState.schemaId;
    } else if (typeof args !== 'object') {
      schemaId = args;
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
        `\nError creating credential definition: ${credentialDefinitionResult.credentialDefinitionState.reason}`,
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
      console.log('schema already exists! Schema is:\n');
      console.dir(checkSchemaExist, {
        depth: null,
        colors: true,
      });
      const credentialDefinitionId =
        await anonCredsApi.getCreatedCredentialDefinitions({
          schemaId: checkSchemaExist.schemaId,
        });
      if (credentialDefinitionId.length == 0) {
        console.log(
          'credential definition has not been registered on this machine!',
        );
        console.log('assigning schemaID string to AcmeAgent object...');
        this.schemaID = checkSchemaExist.schemaId;
        console.log('assigned schemaID for AcmeAgent is: ', this.schemaID);
      } else {
        console.log('credential definition has already exist!');
        console.log(
          'credentialDefinitionId is: \n',
          credentialDefinitionId[0].credentialDefinitionId,
        );
      }
      return {
        schema: checkSchemaExist,
        type: 'GetSchemaReturn',
        flag: true,
      };
    }
    return { schema: 'none', type: 'none', flag: false };
  };
  checkSchemaExits_Nats = async (anonCredsApi: AnonCredsApi, sth: Schema) => {
    var checkSchemaExist = await anonCredsApi.getSchema(sth.id);
    console.log('checkSchemaExist is: ', checkSchemaExist);
    if (
      Object.keys(checkSchemaExist.resolutionMetadata).find(
        (data) => data === 'error',
      )
    ) {
      console.log(
        'error in getting supposed created schema, message is: ',
        checkSchemaExist.resolutionMetadata.error,
      );
      return {
        objectOrError: sth,
        cause: checkSchemaExist.resolutionMetadata.error,
        description: checkSchemaExist.resolutionMetadata.message,
      } as httpErrorException_Return;
    }
    return sth;
  };
  registerSchema_Nats = async (sth: Schema) => {
    const anonCredsApi = this.modules.anoncreds as AnonCredsApi;
    if (sth.id !== undefined && sth.id !== '') {
      return this.checkSchemaExits_Nats(anonCredsApi, sth);
    }
    const schema: AnonCredsSchema = {
      name: sth.name,
      issuerId: this.indyDid,
      attrNames: sth.attributes,
      version: sth.version,
    };
    const schemaResult = await anonCredsApi.registerSchema({
      schema,
      options: {},
    });
    if (schemaResult.schemaState.state === 'failed') {
      console.dir(schemaResult, { depth: null, colors: true });
      return {
        objectOrError: schema,
        cause: `Error creating schema: ${schemaResult.schemaState.reason}`,
        description: `A high probability that this schema has already been registered on the ledger!`,
      } as httpErrorException_Return;
    }

    //NOT USABLE
    //Only keeps track of schemas locally (and previously) registered on this machine instance
    // var idk = await anonCredsApi.getCreatedSchemas({
    //   schemaName: 'test8',
    // });
    // console.log('schema id is: ', idk[0].schemaId);
    // console.dir(idk, { depth: null, colors: true });

    console.log('Schema successfully registered!');
    return {
      ...schemaResult.schemaState.schema,
      id: schemaResult.schemaState.schemaId,
    };
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
    if (checkSchema_flag['flag'] && this.schemaID === '')
      return {
        schema: checkSchema_flag['schema'],
        type: checkSchema_flag['type'],
      };
    else if (this.schemaID !== '') {
      return this.schemaID;
    }

    const schemaResult = await anonCredsApi.registerSchema({
      schema,
      options: {},
    });
    if (schemaResult.schemaState.state === 'failed') {
      console.dir(schemaResult, { depth: null, colors: true });
      console.log(schemaResult.schemaState.schemaId);
      throw new Error(
        `\nError creating schema: ${schemaResult.schemaState.reason} \
        \n\nA high probability that this schema has already been registered on the ledger!
        `,
      );
    }
    console.log('Schema successfully registered!');
    return { schema: schemaResult, type: 'RegisterSchemaReturn' };
  };
  initialDIDSetup = async () => {
    const seed1 = TypedArrayEncoder.fromString(
      `akmalregov0000000000000000000000`,
    );

    const seed2 = TypedArrayEncoder.fromString(
      `akmalregovtest000000000000000000`,
    );

    await this.dids.import({
      did: this.indyDid,
      overwrite: true,
      privateKeys: [
        {
          privateKey: seed1,
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
        console.log('connection payload id is: ', payload.connectionRecord.id);
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
  setupProofRequested = () => {
    this.events.on<ProofStateChangedEvent>(
      ProofEventTypes.ProofStateChanged,
      async ({ payload }) => {
        if (payload.proofRecord.state === ProofState.PresentationReceived) {
          console.log('Presentation has been received. Verifying it...');
        }
        if (payload.proofRecord.state === ProofState.Done) {
          console.log(
            'Presentation proof of the credential has been done! Success!',
          );
        }
      },
    );
  };
}
