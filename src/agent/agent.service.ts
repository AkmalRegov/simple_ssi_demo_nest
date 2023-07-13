import { Injectable } from '@nestjs/common';
import { AcmeAgent } from './class';
import * as QRCode from 'qrcode';

@Injectable()
export class AgentService extends AcmeAgent {
  async getAgent() {
    return 'Should initialize Aries agent!';
  }

  async agentInvite() {
    const outOfBandRecord = await this.oob.createInvitation();
    const res = {
      invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
        domain: 'https://example.org',
      }),
      outOfBandRecord,
    };
    const { outOfBandRecord: outOfBandRecordOld, invitation } =
      await this.oob.createLegacyInvitation({
        autoAcceptConnection: true,
      });

    const invitationUrl = invitation.toUrl({
      domain: 'https://akmalregov.ngrok.dev',
    });
    this.setupConnectionListener(outOfBandRecord);
    this.setupConnectionListener(outOfBandRecordOld);
    this.setupMessageListener();
    QRCode.toFile(
      'QRCode.png',
      invitationUrl,
      {
        errorCorrectionLevel: 'H',
      },
      function (err) {
        if (err) throw err;
        console.log('QR code saved!\n');
      },
    );
    return { outOfBandRecordOld, invitationUrl };
    // return res;
  }
  async sendMessage(connectionId: string, message: string) {
    return this.basicMessages.sendMessage(connectionId, message);
  }
  async serviceOfferCredential(
    connectionId: string,
    credentialDefinitionId: string,
  ) {
    return this.agentOfferCredential(connectionId, credentialDefinitionId);
  }
}
