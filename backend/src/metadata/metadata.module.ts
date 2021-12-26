import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Tile } from '../ingestor/entities/tile.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Tile])],
})
export class MetadataModule {}
