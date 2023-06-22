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
  DidExchangeState,
} from '@aries-framework/core';
import { agentDependencies } from '@aries-framework/node';
import { AskarModule } from '@aries-framework/askar';
import { ariesAskar } from '@hyperledger/aries-askar-nodejs';
import {
  HttpOutboundTransport,
  WsOutboundTransport,
} from '@aries-framework/core';
import { HttpInboundTransport } from '@aries-framework/node';

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
        connections: new ConnectionsModule({ autoAcceptConnections: true }),
      },
      dependencies: agentDependencies,
    });
    this.registerOutboundTransport(new HttpOutboundTransport());
    this.registerOutboundTransport(new WsOutboundTransport());
    this.registerInboundTransport(new HttpInboundTransport({ port: 3333 }));
    this.initialize()
      .then(() => {
        console.log('Acme Agent initialized!');
      })
      .catch((e) => {
        console.error(
          `Something went wrong while setting up the Acme agent! Message: ${e}`,
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
