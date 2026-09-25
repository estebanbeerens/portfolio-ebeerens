import { randomUUID } from 'node:crypto';
import { Client } from 'pg';

const E2E_DATABASE_URL = 'postgresql://portfolio_e2e:portfolio_e2e@localhost:5434/portfolio_e2e';

/**
 * Wipes mutable content tables and resets feature flags to their default (disabled) state.
 * Required because every browser project in this suite shares one long-lived api-e2e server
 * and Postgres instance — tests must not depend on state left behind by another spec/project.
 */
export async function resetAdminE2eDatabase() {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  await client.query('DELETE FROM "ActivityLog"');
  await client.query('DELETE FROM "ContactMessage"');
  await client.query('DELETE FROM "Role"');
  await client.query('DELETE FROM "Organization"');
  await client.query('DELETE FROM "Project"');
  await client.query('DELETE FROM "Skill"');
  await client.query('DELETE FROM "Profile"');
  await client.query('DELETE FROM "Session"');
  await client.query('UPDATE "FeatureFlag" SET enabled = false');
  await client.end();
}

export async function seedContactMessage(
  overrides: Partial<{ fullName: string; email: string; subject: string; message: string }> = {}
) {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  const id = randomUUID();
  await client.query(
    'INSERT INTO "ContactMessage" ("id", "fullName", "email", "subject", "message") VALUES ($1, $2, $3, $4, $5)',
    [
      id,
      overrides.fullName ?? 'Jamie Rivera',
      overrides.email ?? 'jamie@example.com',
      overrides.subject ?? 'Project inquiry',
      overrides.message ?? 'Would love to talk about a project.',
    ]
  );
  await client.end();
  return id;
  return result.rows[0].id as string;
}
