import { Module } from '@nestjs/common';
import { BobAgentService } from './bob_agent.service';
import { BobAgentController } from './bob_agent.controller';

@Module({
  providers: [BobAgentService],
  controllers: [BobAgentController]
})
export class BobAgentModule {}
