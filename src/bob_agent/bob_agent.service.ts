import { Injectable } from '@nestjs/common';
import { BobAgent } from './class';

@Injectable()
export class BobAgentService extends BobAgent {
  async receiveInvitation(invitationUrl: string) {
    const { outOfBandRecord } = await this.oob.receiveInvitationFromUrl(
      invitationUrl,
    );
    this.setupConnectionListener(outOfBandRecord);
    this.setupMessageListener();
    return outOfBandRecord;
  }

  async sendMessage(connectionId: string, message: string) {
    return this.basicMessages.sendMessage(connectionId, message);
  }
}
