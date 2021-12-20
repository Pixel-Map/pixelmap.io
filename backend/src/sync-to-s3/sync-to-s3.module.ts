import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({ imports: [ConfigService] })
export class SyncToS3Module {}
