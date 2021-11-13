import { Module } from '@nestjs/common';
import { TiledataController } from './tiledata.controller';
import { TiledataService } from './tiledata.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tile } from '../ingestor/entities/tile.entity';

@Module({
  controllers: [TiledataController],
  providers: [TiledataService],
  imports: [TypeOrmModule.forFeature([Tile])],
})
export class TiledataModule {}
