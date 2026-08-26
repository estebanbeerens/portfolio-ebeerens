import { Global, Module } from '@nestjs/common';
import { ImageDerivativesService } from './image-derivatives.service';
import { R2Service } from './r2.service';

@Global()
@Module({
  providers: [R2Service, ImageDerivativesService],
  exports: [R2Service, ImageDerivativesService],
})
export class StorageModule {}
