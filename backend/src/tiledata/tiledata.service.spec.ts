import { Test, TestingModule } from '@nestjs/testing';
import { TiledataService } from './tiledata.service';

describe('TiledataService', () => {
  let service: TiledataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TiledataService],
    }).compile();

    service = module.get<TiledataService>(TiledataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
