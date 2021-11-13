import { Controller, Get } from '@nestjs/common';
import { TiledataService } from './tiledata.service';
import { Tile } from '../ingestor/entities/tile.entity';

@Controller('tiledata')
export class TiledataController {
  constructor(private tiledataService: TiledataService) {}

  @Get()
  findAll(): Promise<Tile[]> {
    return this.tiledataService.getAllTiles();
  }
}
