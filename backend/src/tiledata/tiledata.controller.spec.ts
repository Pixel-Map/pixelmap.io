import { Test, TestingModule } from '@nestjs/testing';
import { TiledataController } from './tiledata.controller';

describe('TiledataController', () => {
  let controller: TiledataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiledataController],
    }).compile();

    controller = module.get<TiledataController>(TiledataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
