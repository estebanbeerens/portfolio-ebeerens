import { PublicProfileDto } from '@portfolio-ebeerens/api-client';

export type SocialPlatform = 'github' | 'linkedin' | 'instagram' | 'youtube' | 'x';

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  url: string;
}

const SOCIAL_PLATFORMS: {
  platform: SocialPlatform;
  label: string;
  getUrl: (profile: PublicProfileDto) => string | undefined;
}[] = [
  { platform: 'github', label: 'GitHub', getUrl: (profile) => profile.githubUrl },
  { platform: 'linkedin', label: 'LinkedIn', getUrl: (profile) => profile.linkedinUrl },
  { platform: 'instagram', label: 'Instagram', getUrl: (profile) => profile.instagramUrl },
  { platform: 'youtube', label: 'YouTube', getUrl: (profile) => profile.youtubeUrl },
  { platform: 'x', label: 'X', getUrl: (profile) => profile.xUrl },
];

export function socialLinksFor(profile: PublicProfileDto | undefined): SocialLink[] {
  if (!profile) {
    return [];
  }
  return SOCIAL_PLATFORMS.flatMap(({ platform, label, getUrl }) => {
    const url = getUrl(profile);
    return url ? [{ platform, label, url }] : [];
  });
}
