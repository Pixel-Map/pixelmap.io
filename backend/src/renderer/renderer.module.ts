import { Module } from '@nestjs/common';
import { RendererService } from './renderer.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CurrentState } from '../ingestor/entities/currentState.entity';
import { DataHistory } from '../ingestor/entities/dataHistory.entity';

@Module({
  providers: [RendererService],
  imports: [MikroOrmModule.forFeature([DataHistory, CurrentState])],
})
export class RendererModule {}
