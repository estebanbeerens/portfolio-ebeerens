import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PrismaModule } from './prisma.module';
import { ProfileModule } from './profile/profile.module';
import { ProjectsModule } from './projects/projects.module';
import { RolesModule } from './roles/roles.module';
import { SkillsModule } from './skills/skills.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ProfileModule,
    ProjectsModule,
    SkillsModule,
    OrganizationsModule,
    RolesModule,
    FeatureFlagsModule,
    ContactModule,
  ],
})
export class AppModule {}
