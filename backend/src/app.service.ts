import { Injectable } from '@nestjs/common';
import { Tile } from './ingestor/entities/tile.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, QueryOrder } from '@mikro-orm/core';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Tile)
    private tile: EntityRepository<Tile>,
  ) {}

  public findAll(): Promise<Array<Tile>> {
    return this.tile.findAll();
  }
  getHello(): string {
    return 'Hello World!';
  }
}
