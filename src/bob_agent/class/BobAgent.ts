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
} from '@aries-framework/core';
import { agentDependencies, HttpInboundTransport } from '@aries-framework/node';
import { ariesAskar } from '@hyperledger/aries-askar-nodejs';

export class BobAgent extends Agent {
  constructor() {
    // Simple agent configuration. This sets some basic fields like the wallet
    // configuration and the label. It also sets the mediator invitation url,
    // because this is most likely required in a mobile environment.
    const config: InitConfig = {
      label: 'demo-agent-bob',
      walletConfig: {
        id: 'mainBob',
        key: 'demoagentbob00000000000000000000',
      },
      endpoints: ['http://localhost:9000'],
    };

    super({
      config,
      modules: {
        askar: new AskarModule({ ariesAskar }),
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
      })
      .catch((e) => {
        console.error(
          `Something went wrong while setting up the Bob agent! Message: ${e}`,
        );
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
