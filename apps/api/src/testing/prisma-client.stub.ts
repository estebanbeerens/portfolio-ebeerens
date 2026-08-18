// The generated Prisma client is ESM-only and cannot be parsed by ts-jest; unit tests
// mock PrismaService entirely, so these stand-ins only need to satisfy imports.
export class PrismaClient {
  $connect(): Promise<void> {
    return Promise.resolve();
  }
  $disconnect(): Promise<void> {
    return Promise.resolve();
  }
}

export const ActivityAction = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  DELETED: 'DELETED',
} as const;

export const ActivityEntity = {
  PROFILE: 'PROFILE',
  PROJECT: 'PROJECT',
  ROLE: 'ROLE',
  ORGANIZATION: 'ORGANIZATION',
  RESUME: 'RESUME',
} as const;
