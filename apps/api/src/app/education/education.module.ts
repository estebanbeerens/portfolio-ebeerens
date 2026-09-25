import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma.module';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';

@Module({
  imports: [PrismaModule, AuthModule, ActivityModule],
  controllers: [EducationController],
  providers: [EducationService],
})
export class EducationModule {}
