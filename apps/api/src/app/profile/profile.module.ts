import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma.module';
import { MarkdownRenderService } from '../shared/markdown-render.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [PrismaModule, AuthModule, ActivityModule],
  controllers: [ProfileController],
  providers: [ProfileService, MarkdownRenderService],
})
export class ProfileModule {}
