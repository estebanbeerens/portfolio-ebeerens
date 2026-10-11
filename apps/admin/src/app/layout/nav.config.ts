import {
  LucideBriefcase,
  LucideFlag,
  LucideFolder,
  LucideFileText,
  LucideLayoutGrid,
  LucideMail,
  LucideTags,
  LucideUser,
  type LucideIconInput,
} from '@lucide/angular';

export interface AdminNavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: LucideIconInput;
  readonly badge?: number;
}

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: LucideLayoutGrid },
  { label: 'Basic Info', route: '/basic-info', icon: LucideUser },
  { label: 'Professional Journey', route: '/professional-journey', icon: LucideBriefcase },
  { label: 'Projects', route: '/projects', icon: LucideFolder },
  { label: 'Skills', route: '/skills', icon: LucideTags },
  { label: 'Messages', route: '/messages', icon: LucideMail },
  { label: 'CV requests', route: '/cv-requests', icon: LucideFileText },
  { label: 'Feature Flags', route: '/feature-flags', icon: LucideFlag },
];
