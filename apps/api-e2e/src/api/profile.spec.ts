import axios from 'axios';
import { createAuthenticatedSession, resetE2eDatabase } from '../support/e2e-database';

describe('Profile API', () => {
  beforeEach(async () => {
    await resetE2eDatabase();
  });

  afterAll(async () => {
    await resetE2eDatabase();
  });

  it('creates, returns, and serializes configured profile identity fields', async () => {
    const headers = await createAuthenticatedSession();
    const payload = {
      name: 'Jane Doe',
      headline: 'Frontend engineer',
      location: 'Amsterdam, Netherlands',
      bio: '# About\n\nBuilding accessible interfaces.',
      avatarUrl: 'https://cdn.example.com/jane.png',
      linkedinUrl: 'https://www.linkedin.com/in/jane-doe',
      githubUrl: 'https://github.com/jane-doe',
      instagramUrl: 'https://www.instagram.com/jane-doe',
      xUrl: 'https://x.com/jane-doe',
      youtubeUrl: 'https://www.youtube.com/@jane-doe',
    };

    const update = await axios.put('/api/profile', payload, { headers });
    expect(update.status).toBe(200);
    expect(update.data).toMatchObject(payload);

    const read = await axios.get('/api/profile');
    expect(read.status).toBe(200);
    expect(read.data).toMatchObject(payload);
  });

  it('omits absent optional fields and accepts Markdown biography input', async () => {
    const headers = await createAuthenticatedSession();

    const update = await axios.put(
      '/api/profile',
      { name: 'Jane Doe', bio: '## Biography\n\nMarkdown **source**.' },
      { headers }
    );

    expect(update.status).toBe(200);
    expect(update.data).toEqual(
      expect.objectContaining({
        name: 'Jane Doe',
        bio: '## Biography\n\nMarkdown **source**.',
      })
    );
    expect(update.data).not.toHaveProperty('location');
    expect(update.data).not.toHaveProperty('githubUrl');
  });

  it.each([
    [{ name: '   ' }, 'blank name'],
    [{ name: 'Jane Doe', githubUrl: 'ftp://github.com/jane-doe' }, 'non-HTTP URL'],
    [{ name: 'Jane Doe', linkedinUrl: 'not-a-url' }, 'malformed URL'],
  ])('rejects %s without changing the profile', async (payload, _case) => {
    const headers = await createAuthenticatedSession();

    const response = await axios.put('/api/profile', payload, {
      headers,
      validateStatus: () => true,
    });

    expect(response.status).toBe(400);
    await expect(axios.get('/api/profile', { validateStatus: () => true })).resolves.toMatchObject({
      status: 404,
    });
  });
});
