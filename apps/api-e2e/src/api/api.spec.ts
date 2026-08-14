import axios from 'axios';

describe('GET /api/projects', () => {
  it('should return a list of projects', async () => {
    const res = await axios.get(`/api/projects`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});
