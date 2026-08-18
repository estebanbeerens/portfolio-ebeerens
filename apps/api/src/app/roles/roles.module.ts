import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [PrismaModule, AuthModule, ActivityModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
