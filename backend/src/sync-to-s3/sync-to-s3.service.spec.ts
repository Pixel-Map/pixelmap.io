import { Test, TestingModule } from '@nestjs/testing';
import { SyncToS3Service } from './sync-to-s3.service';

describe('SyncToS3Service', () => {
  let service: SyncToS3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncToS3Service],
    }).compile();

    service = module.get<SyncToS3Service>(SyncToS3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
