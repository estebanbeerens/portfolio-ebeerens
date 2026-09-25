import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EducationModule } from './education/education.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { HealthModule } from './health/health.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PrismaModule } from './prisma.module';
import { ProfileModule } from './profile/profile.module';
import { ProjectsModule } from './projects/projects.module';
import { ResumeModule } from './resume/resume.module';
import { RolesModule } from './roles/roles.module';
import { SkillsModule } from './skills/skills.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    HealthModule,
    ActivityModule,
    AuthModule,
    ProfileModule,
    ProjectsModule,
    SkillsModule,
    OrganizationsModule,
    RolesModule,
    FeatureFlagsModule,
    ContactModule,
    ResumeModule,
    DashboardModule,
    EducationModule,
    InstitutionsModule,
  ],
})
export class AppModule {}
