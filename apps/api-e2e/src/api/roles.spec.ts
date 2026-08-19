import axios from 'axios';
import { createAuthenticatedSession, resetE2eDatabase } from '../support/e2e-database';

describe('Roles API', () => {
  beforeEach(async () => {
    await resetE2eDatabase();
  });

  afterAll(async () => {
    await resetE2eDatabase();
  });

  async function createOrganization(headers: Record<string, string>, name = 'Acme Corp') {
    const response = await axios.post('/api/organizations', { name }, { headers });
    return response.data as { id: string; name: string };
  }

  it('creates a role linked to an organization, with nested organization and skills on read', async () => {
    const headers = await createAuthenticatedSession();
    const organization = await createOrganization(headers);

    const create = await axios.post(
      '/api/roles',
      {
        jobTitle: 'Engineer',
        organizationId: organization.id,
        startDate: '2024-01-15',
        skills: ['TypeScript'],
      },
      { headers }
    );

    expect(create.status).toBe(201);
    expect(create.data).toMatchObject({
      jobTitle: 'Engineer',
      organization: expect.objectContaining({ id: organization.id, name: organization.name }),
      skills: [expect.objectContaining({ name: 'TypeScript' })],
    });

    const list = await axios.get('/api/roles');
    expect(list.status).toBe(200);
    expect(list.data).toEqual([expect.objectContaining({ id: create.data.id })]);

    const read = await axios.get(`/api/roles/${create.data.id}`);
    expect(read.status).toBe(200);
    expect(read.data).toMatchObject({ jobTitle: 'Engineer' });
  });

  it('supports multiple roles under the same organization, grouped by organization on read', async () => {
    const headers = await createAuthenticatedSession();
    const organization = await createOrganization(headers);

    await axios.post(
      '/api/roles',
      { jobTitle: 'Engineer', organizationId: organization.id, startDate: '2022-01-01', endDate: '2023-12-31' },
      { headers }
    );
    await axios.post(
      '/api/roles',
      { jobTitle: 'Senior Engineer', organizationId: organization.id, startDate: '2024-01-01' },
      { headers }
    );

    const list = await axios.get('/api/roles');
    expect(list.status).toBe(200);
    const rolesForOrganization = list.data.filter(
      (role: { organization: { id: string } }) => role.organization.id === organization.id
    );
    expect(rolesForOrganization).toHaveLength(2);
    expect(rolesForOrganization.map((role: { jobTitle: string }) => role.jobTitle).sort()).toEqual([
      'Engineer',
      'Senior Engineer',
    ]);
  });

  it('updates a role, fully replacing its skill set', async () => {
    const headers = await createAuthenticatedSession();
    const organization = await createOrganization(headers);
    const create = await axios.post(
      '/api/roles',
      { jobTitle: 'Engineer', organizationId: organization.id, startDate: '2024-01-15', skills: ['TypeScript'] },
      { headers }
    );

    const update = await axios.put(`/api/roles/${create.data.id}`, { skills: ['NestJS'] }, { headers });

    expect(update.status).toBe(200);
    expect(update.data.skills).toEqual([expect.objectContaining({ name: 'NestJS' })]);
  });

  it('deletes a role', async () => {
    const headers = await createAuthenticatedSession();
    const organization = await createOrganization(headers);
    const create = await axios.post(
      '/api/roles',
      { jobTitle: 'Engineer', organizationId: organization.id, startDate: '2024-01-15' },
      { headers }
    );

    const remove = await axios.delete(`/api/roles/${create.data.id}`, { headers });
    expect(remove.status).toBe(204);

    const read = await axios.get(`/api/roles/${create.data.id}`, { validateStatus: () => true });
    expect(read.status).toBe(404);
  });

  it('rejects mutations without an authenticated session', async () => {
    const response = await axios.post(
      '/api/roles',
      { jobTitle: 'Engineer', organizationId: 'unknown', startDate: '2024-01-15' },
      { validateStatus: () => true }
    );

    expect(response.status).toBe(401);
  });

  it('returns 404 when creating a role for an unknown organization', async () => {
    const headers = await createAuthenticatedSession();

    const response = await axios.post(
      '/api/roles',
      { jobTitle: 'Engineer', organizationId: 'unknown-org', startDate: '2024-01-15' },
      { headers, validateStatus: () => true }
    );

    expect(response.status).toBe(404);
  });

  it('returns 404 for an unknown role id', async () => {
    const response = await axios.get('/api/roles/unknown-id', { validateStatus: () => true });

    expect(response.status).toBe(404);
  });
});
