import { LucideBriefcase, LucideFolder, LucideLayoutGrid, LucideUser, type LucideIconInput } from '@lucide/angular';

export interface AdminNavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: LucideIconInput;
}

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: LucideLayoutGrid },
  { label: 'Basic Info', route: '/basic-info', icon: LucideUser },
  { label: 'Professional Journey', route: '/professional-journey', icon: LucideBriefcase },
  { label: 'Projects', route: '/projects', icon: LucideFolder },
];
