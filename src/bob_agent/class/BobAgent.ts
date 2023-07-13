import { AnonCredsModule, LegacyIndyCredentialFormatService, AnonCredsCredentialFormatService, AnonCredsApi } from '@aries-framework/anoncreds';
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs';
import { AskarModule } from '@aries-framework/askar';
import {
  Agent,
  BasicMessageStateChangedEvent,
  BasicMessageEventTypes,
  BasicMessageRole,
  InitConfig,
  ConnectionsModule,
  WsOutboundTransport,
  HttpOutboundTransport,
  ConnectionStateChangedEvent,
  ConnectionEventTypes,
  DidExchangeState,
  OutOfBandRecord,
  CredentialsModule,
  DidsModule,
  V2CredentialProtocol,
  CredentialEventTypes,
  CredentialState,
  CredentialStateChangedEvent,
} from '@aries-framework/core';
import { IndyVdrModule, IndyVdrAnonCredsRegistry, IndyVdrIndyDidResolver, IndyVdrIndyDidRegistrar } from '@aries-framework/indy-vdr';
import { agentDependencies, HttpInboundTransport } from '@aries-framework/node';
import { anoncreds } from '@hyperledger/anoncreds-nodejs';
import { ariesAskar } from '@hyperledger/aries-askar-nodejs';
import { indyVdr } from '@hyperledger/indy-vdr-nodejs';
import { BCOVRIN_GENESIS_TRANSACTIONS } from 'src/utils';

export class BobAgent extends Agent {
  constructor() {
    const storageConfig = {
      type: 'postgres',
      config: {
        //for docker usage
        host: 'holder-postgres:5432',
        //for local usage
        // host: 'localhost:5432',
      },
      credentials: {
        account: 'postgres',
        password: 'postgres',
        admin_account: 'postgres',
        admin_password: 'postgres',
      },
    }

    // Simple agent configuration. This sets some basic fields like the wallet
    // configuration and the label. It also sets the mediator invitation url,
    // because this is most likely required in a mobile environment.
    const config: InitConfig = {
      label: 'demo-agent-bob',
      walletConfig: {
        id: 'mainBob',
        key: 'demoagentbob00000000000000000000',
        storage: storageConfig,
      },
      endpoints: ['http://localhost:9000'],
    };

    super({
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
            new V2CredentialProtocol({
              credentialFormats: [new LegacyIndyCredentialFormatService(), new AnonCredsCredentialFormatService()],
            }),
          ],
        }),
        connections: new ConnectionsModule({ autoAcceptConnections: true }),
      },
      dependencies: agentDependencies,
    });

    this.registerOutboundTransport(new WsOutboundTransport());
    this.registerOutboundTransport(new HttpOutboundTransport());
    this.registerInboundTransport(new HttpInboundTransport({ port: 9000 }));

    // Initialize the agent
    this.initialize()
      .then(() => {
        console.log('Bob Agent initialized!');
        console.log("Bob Agent wallet storage database is: ", this.agentConfig.walletConfig.storage);
        console.log("Creating link secret for holder...");
        (this.modules.anoncreds as AnonCredsApi).createLinkSecret().then(() => {
          console.log("Holder's link secret created.");
        })
      })
      .catch((e) => {
        console.error(
          `Something went wrong while setting up the Bob agent! Message: ${e}`,
        );
      });
    
    console.log("Listening for incoming credentials...");
    this.events.on<CredentialStateChangedEvent>(CredentialEventTypes.CredentialStateChanged, async ({ payload }) => {
      switch (payload.credentialRecord.state) {
        case CredentialState.OfferReceived:
          console.log('received a credential')
          // custom logic here
          await this.credentials.acceptOffer({ credentialRecordId: payload.credentialRecord.id })
        case CredentialState.Done:
          console.log(`Credential for credential id ${payload.credentialRecord.id} is accepted`)
          // For demo purposes we exit the program here.
          // process.exit(0)
      }
    });
  }
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
            `Bob Agent, ConnectionId is: `,
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
        if (payload.basicMessageRecord.role === BasicMessageRole.Receiver) {
          console.log(`Bob received a message: ${payload.message.content}`);
          // Custom business logic can be included here
          // In this example we can send a basic message to the connection, but
          // anything is possible
          if (cb) cb();
        }
        if (payload.basicMessageRecord.role === BasicMessageRole.Sender) {
          console.log(`Bob sent a message: ${payload.message.content}`);
        }
      },
    );
  };
}
