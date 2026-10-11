import { NotFoundException } from '@nestjs/common';
import { fingerprint, githubAvatarUrl, ResumeContentService } from './resume-content.service';

describe('ResumeContentService', () => {
  function build(enabled = ['RESUME', 'ROLES', 'PROJECTS']) {
    const project = (id: string) => ({
      id,
      title: id,
      slug: id,
      client: null,
      jobRole: null,
      liveUrl: null,
      startDate: new Date('2025-01-01Z'),
      endDate: null,
      descriptionEn: 'English',
      descriptionNl: null,
      shortDescriptionEn: 'Short English summary',
      shortDescriptionNl: null,
      skills: [{ name: 'angular', category: { id: 'frontend', name: 'Frontend' } }],
    });
    const transaction = {
      profile: { findFirst: jest.fn().mockResolvedValue({ name: 'Esteban', bioEn: 'Biography', bioNl: null }) },
      featureFlag: { findMany: jest.fn().mockResolvedValue(enabled.map((key) => ({ key, enabled: true }))) },
      role: { findMany: jest.fn().mockResolvedValue([]) },
      education: { findMany: jest.fn().mockResolvedValue([]) },
      project: {
        findMany: jest.fn().mockResolvedValue(Array.from({ length: 8 }, (_, index) => project(`project-${index}`))),
      },
    };
    const service = new ResumeContentService({
      $transaction: (callback: (value: unknown) => unknown) => callback(transaction),
    } as never);
    return { service, transaction };
  }

  it('includes every starred project, uses Dutch fallback and deduplicates skills', async () => {
    const { service, transaction } = build();
    const result = await service.snapshot('nl');
    expect(result.projects).toHaveLength(8);
    expect(result.projects[0].description).toBe('Short English summary');
    expect(result.projects[0].pageUrl).toContain('/nl/projects/project-0');
    expect(result.bio).toBe('Biography');
    expect(result.skills).toEqual([{ name: 'Frontend', skills: ['angular'] }]);
    expect(transaction.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isCvFeatured: true } })
    );
    expect(transaction.project.findMany.mock.calls[0][0]).not.toHaveProperty('take');
    expect(result).not.toHaveProperty('id');
  });

  it('excludes disabled sections and their skills', async () => {
    const { service } = build(['RESUME']);
    const result = await service.snapshot('en');
    expect(result.projects).toEqual([]);
    expect(result.skills).toEqual([]);
  });

  it('omits unassigned skills and sorts populated categories and deduplicated skill names', async () => {
    const { service, transaction } = build();
    const projects = await transaction.project.findMany();
    transaction.project.findMany.mockResolvedValue([
      {
        ...projects[0],
        skills: [
          { name: 'typescript', category: { id: 'frontend', name: 'Frontend' } },
          { name: 'angular', category: { id: 'frontend', name: 'Frontend' } },
          { name: 'unassigned', category: null },
          { name: 'postgresql', category: { id: 'backend', name: 'Backend' } },
        ],
      },
      { ...projects[1], skills: [{ name: 'angular', category: { id: 'frontend', name: 'Frontend' } }] },
    ] as never);
    const result = await service.snapshot('en');
    expect(result.skills).toEqual([
      { name: 'Backend', skills: ['postgresql'] },
      { name: 'Frontend', skills: ['angular', 'typescript'] },
    ]);
    const originalHash = fingerprint(result);
    transaction.project.findMany.mockResolvedValue([
      { ...projects[0], skills: [{ name: 'angular', category: null }] },
    ] as never);
    const unassigned = await service.snapshot('en');
    expect(unassigned.skills).toEqual([]);
    expect(fingerprint(unassigned)).not.toBe(originalHash);
  });

  it('uses localized short descriptions instead of full project descriptions', async () => {
    const { service, transaction } = build();
    transaction.project.findMany.mockResolvedValue([
      {
        id: 'project-1',
        title: 'Project',
        slug: 'project',
        client: null,
        jobRole: null,
        liveUrl: null,
        startDate: new Date('2025-01-01Z'),
        endDate: null,
        skills: [],
        descriptionEn: 'Full English description',
        descriptionNl: 'Volledige beschrijving',
        shortDescriptionEn: 'Short English summary',
        shortDescriptionNl: 'Korte samenvatting',
      },
    ]);
    expect((await service.snapshot('en')).projects[0].description).toBe('Short English summary');
    expect((await service.snapshot('nl')).projects[0].description).toBe('Korte samenvatting');
  });

  it('guards public downloads but allows authenticated preview while disabled', async () => {
    const { service } = build([]);
    await expect(service.snapshot('en')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.snapshot('en', true)).resolves.toMatchObject({ name: 'Esteban' });
  });

  it('changes the fingerprint on deletion and locale changes', async () => {
    const { service } = build();
    const content = await service.snapshot('en');
    expect(fingerprint(content)).toBe(fingerprint({ ...content }));
    expect(fingerprint(content)).not.toBe(fingerprint({ ...content, projects: [] }));
    expect(fingerprint(content)).not.toBe(fingerprint({ ...content, locale: 'nl' }));
    expect(fingerprint(content)).not.toBe(
      fingerprint({ ...content, avatarUrl: 'https://avatars.githubusercontent.com/u/123?s=256' })
    );
  });

  it('includes the configured GitHub avatar in the PDF snapshot', async () => {
    const { service, transaction } = build();
    transaction.profile.findFirst.mockResolvedValue({
      name: 'Esteban',
      bioEn: 'Biography',
      bioNl: null,
      avatarUrl: 'https://avatars.githubusercontent.com/u/123?v=4',
    } as never);
    expect((await service.snapshot('en')).avatarUrl).toBe('https://avatars.githubusercontent.com/u/123?v=4&s=256');
  });

  it('resolves only GitHub-hosted portraits, falling back to the GitHub username', () => {
    expect(githubAvatarUrl(undefined, 'https://github.com/estebanbeerens')).toBe(
      'https://avatars.githubusercontent.com/estebanbeerens?s=256'
    );
    expect(githubAvatarUrl('https://other.example/image', 'https://github.com/estebanbeerens')).toBe(
      'https://avatars.githubusercontent.com/estebanbeerens?s=256'
    );
    expect(githubAvatarUrl('http://127.0.0.1/image')).toBeUndefined();
    expect(githubAvatarUrl(undefined, 'https://github.com.evil.example/name')).toBeUndefined();
  });
});
