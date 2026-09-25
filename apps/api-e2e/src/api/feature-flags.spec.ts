import axios from 'axios';
import { createAuthenticatedSession, resetE2eDatabase } from '../support/e2e-database';

describe('Feature Flags API', () => {
  beforeEach(async () => {
    await resetE2eDatabase();
  });

  afterAll(async () => {
    await resetE2eDatabase();
  });

  it('lists flags publicly and reflects an authenticated toggle', async () => {
    const publicRead = await axios.get('/api/feature-flags');
    expect(publicRead.status).toBe(200);
    expect(publicRead.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'CONTACT', enabled: false })])
    );

    const headers = await createAuthenticatedSession();
    const update = await axios.put('/api/feature-flags/CONTACT', { enabled: true }, { headers });
    expect(update.status).toBe(200);
    expect(update.data).toMatchObject({ key: 'CONTACT', enabled: true });

    const afterUpdate = await axios.get('/api/feature-flags');
    expect(afterUpdate.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'CONTACT', enabled: true })])
    );
  });

  it('rejects an unauthenticated toggle with 401', async () => {
    const response = await axios.put('/api/feature-flags/CONTACT', { enabled: true }, { validateStatus: () => true });

    expect(response.status).toBe(401);
  });
});
