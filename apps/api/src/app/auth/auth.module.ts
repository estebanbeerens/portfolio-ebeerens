import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GithubAuthGuard } from './github-auth.guard';
import { GithubStrategy } from './github.strategy';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionCleanupService } from './session-cleanup.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'github' }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GithubStrategy,
    GithubAuthGuard,
    SessionAuthGuard,
    SessionCleanupService,
  ],
  exports: [AuthService, SessionAuthGuard],
})
export class AuthModule {}
