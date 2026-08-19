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

// Minimal stand-in for Prisma's known-error class so services' `instanceof` checks work under mocked PrismaService.
export class PrismaClientKnownRequestError extends Error {
  code: string;
  clientVersion: string;

  constructor(message: string, params: { code: string; clientVersion: string }) {
    super(message);
    this.code = params.code;
    this.clientVersion = params.clientVersion;
  }
}

export const Prisma = {
  PrismaClientKnownRequestError,
};
