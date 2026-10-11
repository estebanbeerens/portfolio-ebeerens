import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma.module';
import { PrivacyModule } from '../privacy/privacy.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [PrismaModule, AuthModule, PrivacyModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
