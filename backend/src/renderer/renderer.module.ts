import { Module } from '@nestjs/common';
import { RendererService } from './renderer.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CurrentState } from '../ingestor/entities/currentState.entity';
import { DataHistory } from '../ingestor/entities/dataHistory.entity';
import { ConfigService } from '@nestjs/config';
import { Tile } from '../ingestor/entities/tile.entity';

@Module({
  providers: [RendererService],
  imports: [MikroOrmModule.forFeature([DataHistory, CurrentState, Tile]), ConfigService],
})
export class RendererModule {}
