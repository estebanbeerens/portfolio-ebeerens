import { Module } from '@nestjs/common';
import { McpOAuthModule } from './mcp-oauth.module';
import { McpController } from './mcp.controller';
import { McpToolsService } from './mcp-tools.service';
import { ProfileModule } from '../profile/profile.module';
import { ProjectsModule } from '../projects/projects.module';
import { SkillsModule } from '../skills/skills.module';

@Module({
  imports: [McpOAuthModule, ProfileModule, ProjectsModule, SkillsModule],
  controllers: [McpController],
  providers: [McpToolsService],
})
export class McpModule {}
