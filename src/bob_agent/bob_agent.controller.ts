import { Body, Controller, Post } from '@nestjs/common';
import { BobAgentService } from './bob_agent.service';

class inviteDto {
  invitationUrl: string;
}

class sendMessageDto {
  connectionId: string;
  message: string;
}

@Controller('bob-agent')
export class BobAgentController {
  constructor(private bobAgentService: BobAgentService) {}

  @Post('receiveInvite')
  receiveInvite(@Body() invitationUrl: inviteDto) {
    return this.bobAgentService.receiveInvitation(invitationUrl.invitationUrl);
  }

  @Post('sendMessage')
  sendMessage(@Body() dto: sendMessageDto) {
    return this.bobAgentService.sendMessage(dto.connectionId, dto.message);
  }
}
