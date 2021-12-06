import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Tile } from '../ingestor/entities/tile.entity';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [MikroOrmModule.forFeature([Tile]), ConfigService],
})
export class MetadataModule {}
