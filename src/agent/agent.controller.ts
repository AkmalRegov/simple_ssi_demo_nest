import { Body, Controller, Get, Post } from '@nestjs/common';
import { AgentService } from './agent.service';

class sendMessageDto {
  connectionId: string;
  message: string;
}

class offerCredentialDto {
  connectionId: string;
  credentialDefinitionId: string;
}

@Controller('agent')
export class AgentController {
  constructor(private agentService: AgentService) {}

  @Get()
  initAgent() {
    return this.agentService.getAgent();
  }

  @Get('init')
  getAgent() {
    return this.agentService.getAgent();
  }

  @Get('invite')
  agentInvite() {
    return this.agentService.agentInvite();
  }

  @Post('sendMessage')
  sendMessage(@Body() dto: sendMessageDto) {
    return this.agentService.sendMessage(dto.connectionId, dto.message);
  }

  @Post('offerCredential')
  offerCredential(@Body() dto: offerCredentialDto) {
    this.agentService.setupCredentialOffered();
    return this.agentService.serviceOfferCredential(
      dto.connectionId,
      dto.credentialDefinitionId,
    );
  }
}
