import axios from 'axios';

describe('Auth-guarded routes without a session cookie', () => {
  it('GET /api/auth/me returns 401', async () => {
    const res = await axios.get('/api/auth/me', { validateStatus: () => true });

    expect(res.status).toBe(401);
  });

  it('PUT /api/profile returns 401', async () => {
    const res = await axios.put(
      '/api/profile',
      {},
      { validateStatus: () => true },
    );

    expect(res.status).toBe(401);
  });

  it('POST /api/projects returns 401', async () => {
    const res = await axios.post(
      '/api/projects',
      {},
      { validateStatus: () => true },
    );

    expect(res.status).toBe(401);
  });
});
