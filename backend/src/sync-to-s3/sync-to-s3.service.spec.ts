import { Test, TestingModule } from '@nestjs/testing';
import { SyncToS3Service } from './sync-to-s3.service';
import { ConfigModule } from '@nestjs/config';

describe('SyncToS3Service', () => {
  let service: SyncToS3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncToS3Service],
      imports: [ConfigModule],
    }).compile();

    service = module.get<SyncToS3Service>(SyncToS3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
