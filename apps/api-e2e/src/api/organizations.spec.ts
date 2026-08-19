import axios from 'axios';
import { createAuthenticatedSession, resetE2eDatabase } from '../support/e2e-database';

describe('Organizations API', () => {
  beforeEach(async () => {
    await resetE2eDatabase();
  });

  afterAll(async () => {
    await resetE2eDatabase();
  });

  it('creates, lists, and returns an organization', async () => {
    const headers = await createAuthenticatedSession();

    const create = await axios.post('/api/organizations', { name: 'Acme Corp' }, { headers });
    expect(create.status).toBe(201);
    expect(create.data).toMatchObject({ name: 'Acme Corp' });

    const list = await axios.get('/api/organizations');
    expect(list.status).toBe(200);
    expect(list.data).toEqual([expect.objectContaining({ id: create.data.id, name: 'Acme Corp' })]);

    const read = await axios.get(`/api/organizations/${create.data.id}`);
    expect(read.status).toBe(200);
    expect(read.data).toMatchObject({ name: 'Acme Corp' });
  });

  it('updates an organization', async () => {
    const headers = await createAuthenticatedSession();
    const create = await axios.post('/api/organizations', { name: 'Acme Corp' }, { headers });

    const update = await axios.put(
      `/api/organizations/${create.data.id}`,
      { website: 'https://acme.example.com' },
      { headers }
    );

    expect(update.status).toBe(200);
    expect(update.data).toMatchObject({ name: 'Acme Corp', website: 'https://acme.example.com' });
  });

  it('deletes an organization that has no roles', async () => {
    const headers = await createAuthenticatedSession();
    const create = await axios.post('/api/organizations', { name: 'Acme Corp' }, { headers });

    const remove = await axios.delete(`/api/organizations/${create.data.id}`, { headers });
    expect(remove.status).toBe(204);

    const read = await axios.get(`/api/organizations/${create.data.id}`, { validateStatus: () => true });
    expect(read.status).toBe(404);
  });

  it('rejects mutations without an authenticated session', async () => {
    const response = await axios.post('/api/organizations', { name: 'Acme Corp' }, { validateStatus: () => true });

    expect(response.status).toBe(401);
  });

  it('rejects a duplicate organization name with 409', async () => {
    const headers = await createAuthenticatedSession();
    await axios.post('/api/organizations', { name: 'Acme Corp' }, { headers });

    const duplicate = await axios.post(
      '/api/organizations',
      { name: 'Acme Corp' },
      { headers, validateStatus: () => true }
    );

    expect(duplicate.status).toBe(409);
  });

  it('rejects deleting an organization that still has roles referencing it', async () => {
    const headers = await createAuthenticatedSession();
    const organization = await axios.post('/api/organizations', { name: 'Acme Corp' }, { headers });
    await axios.post(
      '/api/roles',
      { jobTitle: 'Engineer', organizationId: organization.data.id, startDate: '2024-01-15' },
      { headers }
    );

    const remove = await axios.delete(`/api/organizations/${organization.data.id}`, {
      headers,
      validateStatus: () => true,
    });

    expect(remove.status).toBe(409);
  });

  it('returns 404 for an unknown organization id', async () => {
    const response = await axios.get('/api/organizations/unknown-id', { validateStatus: () => true });

    expect(response.status).toBe(404);
  });
});
