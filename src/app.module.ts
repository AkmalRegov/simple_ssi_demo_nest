import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { BobAgentModule } from './bob_agent/bob_agent.module';
import { SchemaModule } from './schema/schema.module';

@Module({
  imports: [AgentModule, BobAgentModule, SchemaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
