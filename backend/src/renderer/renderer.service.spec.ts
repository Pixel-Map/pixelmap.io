import { Test, TestingModule } from '@nestjs/testing';
import { RendererService } from './renderer.service';

describe('RendererService', () => {
  let service: RendererService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RendererService],
    }).compile();

    service = module.get<RendererService>(RendererService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
