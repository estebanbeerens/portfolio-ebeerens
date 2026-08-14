export * from './auth.service';
import { AuthService } from './auth.service';
export * from './profile.service';
import { ProfileService } from './profile.service';
export * from './projects.service';
import { ProjectsService } from './projects.service';
export const APIS = [AuthService, ProfileService, ProjectsService];
