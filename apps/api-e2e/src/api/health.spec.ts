import axios from 'axios';

describe('Health API', () => {
  it('returns ok status', async () => {
    const res = await axios.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok' });
  });
});
