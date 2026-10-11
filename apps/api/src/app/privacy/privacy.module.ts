import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StorageModule } from '../storage/storage.module';
import { PrivacyErasureService } from './privacy-erasure.service';
import { PrivacyService } from './privacy.service';
import { TurnstileVerifier } from './turnstile-verifier.service';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [PrivacyService, TurnstileVerifier, PrivacyErasureService],
  exports: [TurnstileVerifier, PrivacyErasureService],
})
export class PrivacyModule {}
