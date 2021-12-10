import { Module } from '@nestjs/common';
import { OpenseaService } from './opensea.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Tile } from '../ingestor/entities/tile.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [OpenseaService],
  imports: [MikroOrmModule.forFeature([Tile]), HttpModule],
})
export class OpenseaModule {}
