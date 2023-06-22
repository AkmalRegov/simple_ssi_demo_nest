import { Injectable } from '@nestjs/common';
import { AcmeAgent } from './class';

@Injectable()
export class AgentService extends AcmeAgent {
  async getAgent() {
    return 'Should initialize Aries agent!';
  }

  async agentInvite() {
    const outOfBandRecord = await this.oob.createInvitation();
    this.setupConnectionListener(outOfBandRecord);
    this.setupMessageListener();
    return {
      invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
        domain: 'https://example.org',
      }),
      outOfBandRecord,
    };
  }
  async sendMessage(connectionId: string, message: string) {
    return this.basicMessages.sendMessage(connectionId, message);
  }
}
