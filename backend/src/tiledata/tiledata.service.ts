import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tile } from '../ingestor/entities/tile.entity';

@Injectable()
export class TiledataService {
  constructor(
    @InjectRepository(Tile)
    private tileRepository: Repository<Tile>,
  ) {}
  async getAllTiles(): Promise<Tile[]> {
    return this.tileRepository.createQueryBuilder('tile').orderBy('tile.id', 'ASC').getMany();
  }
}
