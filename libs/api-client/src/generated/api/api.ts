export * from './auth.service';
import { AuthService } from './auth.service';
export * from './contact.service';
import { ContactService } from './contact.service';
export * from './dashboard.service';
import { DashboardService } from './dashboard.service';
export * from './education.service';
import { EducationService } from './education.service';
export * from './featureFlags.service';
import { FeatureFlagsService } from './featureFlags.service';
export * from './institutions.service';
import { InstitutionsService } from './institutions.service';
export * from './organizations.service';
import { OrganizationsService } from './organizations.service';
export * from './profile.service';
import { ProfileService } from './profile.service';
export * from './projects.service';
import { ProjectsService } from './projects.service';
export * from './resume.service';
import { ResumeService } from './resume.service';
export * from './roles.service';
import { RolesService } from './roles.service';
export * from './skills.service';
import { SkillsService } from './skills.service';
export const APIS = [
  AuthService,
  ContactService,
  DashboardService,
  EducationService,
  FeatureFlagsService,
  InstitutionsService,
  OrganizationsService,
  ProfileService,
  ProjectsService,
  ResumeService,
  RolesService,
  SkillsService,
];
