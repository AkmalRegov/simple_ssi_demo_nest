import { Injectable } from '@nestjs/common';
import { AgentService } from './agent/agent.service';

@Injectable()
export class AppService {
  constructor(private agentService: AgentService) {}

  getHello(): string {
    return 'Hello World!';
  }
}
