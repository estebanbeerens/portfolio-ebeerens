import { Test } from '@nestjs/testing';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const updatedAt = new Date('2026-08-19T00:00:00.000Z');
  const profile = {
    id: 'profile-1',
    name: 'Jane Doe',
    headline: null,
    bio: null,
    avatarUrl: null,
    location: null,
    linkedinUrl: null,
    githubUrl: null,
    instagramUrl: null,
    xUrl: null,
    youtubeUrl: null,
    updatedAt,
  };

  async function build() {
    const prisma = {
      profile: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    const activity = { record: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: prisma },
        { provide: ActivityService, useValue: activity },
      ],
    }).compile();

    return {
      service: moduleRef.get(ProfileService),
      prisma,
      activity,
    };
  }

  it('omits absent nullable profile fields from the public DTO', async () => {
    const { service, prisma } = await build();
    prisma.profile.findFirst.mockResolvedValue(profile);

    await expect(service.findProfile()).resolves.toEqual({
      id: 'profile-1',
      name: 'Jane Doe',
      updatedAt,
    });
  });

  it('writes empty optional fields as storage nulls and returns configured fields', async () => {
    const { service, prisma, activity } = await build();
    prisma.profile.findFirst.mockResolvedValue(profile);
    prisma.profile.update.mockResolvedValue({
      ...profile,
      headline: 'Frontend engineer',
      bio: '# About',
      location: 'Amsterdam, Netherlands',
      githubUrl: 'https://github.com/jane-doe',
    });

    await expect(
      service.upsertProfile({
        name: 'Jane Doe',
        headline: 'Frontend engineer',
        bio: '# About',
        location: 'Amsterdam, Netherlands',
        githubUrl: 'https://github.com/jane-doe',
      })
    ).resolves.toMatchObject({
      name: 'Jane Doe',
      headline: 'Frontend engineer',
      bio: '# About',
      location: 'Amsterdam, Netherlands',
      githubUrl: 'https://github.com/jane-doe',
    });

    expect(prisma.profile.update).toHaveBeenCalledWith({
      where: { id: 'profile-1' },
      data: {
        name: 'Jane Doe',
        headline: 'Frontend engineer',
        bio: '# About',
        avatarUrl: null,
        location: 'Amsterdam, Netherlands',
        linkedinUrl: null,
        githubUrl: 'https://github.com/jane-doe',
        instagramUrl: null,
        xUrl: null,
        youtubeUrl: null,
      },
    });
    expect(activity.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATED' }));
  });
});
