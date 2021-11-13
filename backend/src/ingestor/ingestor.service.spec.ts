import { Test, TestingModule } from '@nestjs/testing';
import { IngestorService } from './ingestor.service';

describe('EthereumService', () => {
  let service: IngestorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IngestorService],
    }).compile();

    service = module.get<IngestorService>(IngestorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
