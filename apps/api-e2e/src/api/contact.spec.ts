import axios from 'axios';
import { resetE2eDatabase } from '../support/e2e-database';

describe('Contact API', () => {
  beforeEach(async () => {
    await resetE2eDatabase();
  });

  afterAll(async () => {
    await resetE2eDatabase();
  });

  it('rejects a submission with an invalid Turnstile token', async () => {
    const response = await axios.post(
      '/api/contact',
      {
        fullName: 'Jamie Rivera',
        email: 'jamie@example.com',
        subject: 'Project inquiry',
        message: 'Would love to talk about a project.',
        turnstileToken: 'not-a-real-token',
      },
      { validateStatus: () => true }
    );

    expect(response.status).toBe(400);
  });

  it('rejects listing messages without an authenticated session', async () => {
    const response = await axios.get('/api/contact', { validateStatus: () => true });

    expect(response.status).toBe(401);
  });
});
