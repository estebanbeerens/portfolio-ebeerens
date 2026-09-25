import axios from 'axios';
import { createAuthenticatedSession, resetE2eDatabase } from '../support/e2e-database';

describe('Projects API', () => {
  beforeEach(async () => {
    await resetE2eDatabase();
  });

  afterAll(async () => {
    await resetE2eDatabase();
  });

  const basePayload = {
    title: 'Aether Dashboard',
    slug: 'aether-dashboard',
    shortDescriptionEn: 'A real-time analytics cockpit.',
    descriptionEn: '## Overview\n\nBuilt with Angular and NestJS.',
    startDate: '2024-01-01',
  };

  it('creates, lists, and returns a project', async () => {
    const headers = await createAuthenticatedSession();

    const create = await axios.post('/api/projects', basePayload, { headers });
    expect(create.status).toBe(201);
    expect(create.data).toMatchObject({ title: 'Aether Dashboard', slug: 'aether-dashboard' });

    const list = await axios.get('/api/projects');
    expect(list.status).toBe(200);
    expect(list.data).toEqual([expect.objectContaining({ id: create.data.id, slug: 'aether-dashboard' })]);

    const read = await axios.get(`/api/projects/${create.data.id}`);
    expect(read.status).toBe(200);
    expect(read.data).toMatchObject({ title: 'Aether Dashboard' });
  });

  it('updates a project', async () => {
    const headers = await createAuthenticatedSession();
    const create = await axios.post('/api/projects', basePayload, { headers });

    const update = await axios.put(`/api/projects/${create.data.id}`, { client: 'Acme Corp' }, { headers });

    expect(update.status).toBe(200);
    expect(update.data).toMatchObject({ title: 'Aether Dashboard', client: 'Acme Corp' });
  });

  it('deletes a project', async () => {
    const headers = await createAuthenticatedSession();
    const create = await axios.post('/api/projects', basePayload, { headers });

    const remove = await axios.delete(`/api/projects/${create.data.id}`, { headers });
    expect(remove.status).toBe(204);

    const read = await axios.get(`/api/projects/${create.data.id}`, { validateStatus: () => true });
    expect(read.status).toBe(404);
  });

  it('rejects a duplicate project slug with 409', async () => {
    const headers = await createAuthenticatedSession();
    await axios.post('/api/projects', basePayload, { headers });

    const duplicate = await axios.post('/api/projects', basePayload, {
      headers,
      validateStatus: () => true,
    });

    expect(duplicate.status).toBe(409);
  });
});
