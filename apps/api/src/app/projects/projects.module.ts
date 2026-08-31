import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma.module';
import { MarkdownRenderService } from '../shared/markdown-render.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [PrismaModule, AuthModule, ActivityModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, MarkdownRenderService],
})
export class ProjectsModule {}
