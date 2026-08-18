import {
  LucideBriefcase,
  LucideFolder,
  LucidePlus,
  LucideRefreshCw,
  LucideSquarePen,
  LucideTrash2,
  LucideUpload,
  LucideUser,
  type LucideIconInput,
} from '@lucide/angular';
import { ActivityAction, ActivityEntity } from '@portfolio-ebeerens/api-client';

export interface QuickActionEntry {
  readonly label: string;
  readonly description: string;
  readonly route: string;
  readonly icon: LucideIconInput;
}

export const DASHBOARD_QUICK_ACTIONS: readonly QuickActionEntry[] = [
  { label: 'Edit Personal Summary', description: 'Basic Info', route: '/basic-info', icon: LucideSquarePen },
  { label: 'Upload New Resume', description: 'Basic Info', route: '/basic-info', icon: LucideUpload },
  {
    label: 'Add Work Position',
    description: 'Professional Journey',
    route: '/professional-journey',
    icon: LucideBriefcase,
  },
  { label: 'Add Project Artifact', description: 'Projects', route: '/projects', icon: LucidePlus },
];

const ENTITY_ICONS: Record<ActivityEntity, LucideIconInput> = {
  [ActivityEntity.Profile]: LucideUser,
  [ActivityEntity.Project]: LucideFolder,
  [ActivityEntity.Role]: LucideBriefcase,
  [ActivityEntity.Organization]: LucideBriefcase,
  [ActivityEntity.Resume]: LucideUpload,
};

export function activityIcon(entityType: ActivityEntity, action: ActivityAction): LucideIconInput {
  if (action === ActivityAction.Created) {
    return LucidePlus;
  }
  if (action === ActivityAction.Deleted) {
    return LucideTrash2;
  }
  return ENTITY_ICONS[entityType] ?? LucideRefreshCw;
}
