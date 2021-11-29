import { Module } from '@nestjs/common';
import { RendererService } from './renderer.service';

@Module({
  providers: [RendererService]
})
export class RendererModule {}
