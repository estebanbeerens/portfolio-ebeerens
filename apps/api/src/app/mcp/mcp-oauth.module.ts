import { Module } from '@nestjs/common';
import { McpOAuthController } from './mcp-oauth.controller';
import { PrismaModule } from '../prisma.module';
import { McpOAuthService } from './mcp-oauth.service';

@Module({
  imports: [PrismaModule],
  controllers: [McpOAuthController],
  providers: [McpOAuthService],
  exports: [McpOAuthService],
})
export class McpOAuthModule {}
