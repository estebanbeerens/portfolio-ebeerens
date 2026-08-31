import { PublicProfileDto } from '@portfolio-ebeerens/api-client';
import { socialLinksFor } from './social-link.model';

describe('socialLinksFor', () => {
  it('returns an empty list when the profile is absent', () => {
    expect(socialLinksFor(undefined)).toEqual([]);
  });

  it('includes only the platforms with a URL, in a stable display order', () => {
    const profile: PublicProfileDto = {
      id: 'profile-1',
      name: 'John Beerens',
      githubUrl: 'https://github.com/john',
      instagramUrl: 'https://instagram.com/john',
      updatedAt: '2026-01-01',
    };

    expect(socialLinksFor(profile)).toEqual([
      { platform: 'github', label: 'GitHub', url: 'https://github.com/john' },
      { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/john' },
    ]);
  });
});
