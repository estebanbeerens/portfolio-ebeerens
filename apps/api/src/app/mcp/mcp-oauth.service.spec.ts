import { createHash } from 'node:crypto';
import { Response } from 'express';
import {
  InvalidClientMetadataError,
  InvalidGrantError,
  InvalidTokenError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import { PrismaService } from '../prisma.service';
import { McpOAuthService } from './mcp-oauth.service';

describe('McpOAuthService', () => {
  const client: OAuthClientInformationFull = {
    client_id: 'test-client',
    client_name: 'Test client',
    redirect_uris: ['http://127.0.0.1:4321/callback'],
    token_endpoint_auth_method: 'none',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
  };
  const transaction = {
    id: 'f'.repeat(64),
    clientId: client.client_id,
    redirectUri: client.redirect_uris[0],
    codeChallenge: 'test-challenge',
    scopes: ['portfolio:read'],
    resource: 'https://mcp.example.com/mcp',
    state: 'client-state',
    authorizationCodeHash: null,
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    usedAt: null,
  };

  let service: McpOAuthService;
  let prisma: {
    mcpOAuthClient: { findUnique: jest.Mock; create: jest.Mock };
    mcpOAuthAuthorization: { create: jest.Mock; findUnique: jest.Mock; updateMany: jest.Mock; delete: jest.Mock };
    mcpOAuthToken: { findUnique: jest.Mock; createMany: jest.Mock; updateMany: jest.Mock; deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    process.env.MCP_PUBLIC_URL = 'https://mcp.example.com';
    process.env.ADMIN_APP_URL = 'https://admin.example.com';
    process.env.ADMIN_GITHUB_ID = 'owner-id';
    prisma = {
      mcpOAuthClient: { findUnique: jest.fn(), create: jest.fn() },
      mcpOAuthAuthorization: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      mcpOAuthToken: {
        findUnique: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new McpOAuthService(prisma as unknown as PrismaService);
  });

  afterAll(() => {
    delete process.env.MCP_PUBLIC_URL;
    delete process.env.ADMIN_APP_URL;
    delete process.env.ADMIN_GITHUB_ID;
  });

  it('rejects confidential OAuth clients rather than persisting a client secret', async () => {
    await expect(
      service.registerClient({ ...client, token_endpoint_auth_method: 'client_secret_post' })
    ).rejects.toBeInstanceOf(InvalidClientMetadataError);
    expect(prisma.mcpOAuthClient.create).not.toHaveBeenCalled();
  });

  it('registers public clients without client secrets', async () => {
    await expect(service.registerClient(client)).resolves.toEqual(client);
    expect(prisma.mcpOAuthClient.create).toHaveBeenCalledWith({
      data: {
        id: client.client_id,
        clientMetadata: client,
      },
    });
  });

  it('stores the authorization transaction and redirects only to the configured admin flow', async () => {
    const redirect = jest.fn();
    const response = { redirect } as unknown as Response;
    await service.authorize(
      client,
      {
        redirectUri: client.redirect_uris[0],
        codeChallenge: 'challenge',
        scopes: ['portfolio:read'],
        state: 'client-state',
        resource: new URL('https://mcp.example.com/mcp'),
      },
      response
    );

    const url = new URL(redirect.mock.calls[0][0] as string);
    expect(url.origin).toBe('https://admin.example.com');
    expect(url.pathname).toBe('/api/mcp/oauth/start');
    expect(url.searchParams.get('transactionId')).toMatch(/^[a-f0-9]{64}$/);
    expect(prisma.mcpOAuthAuthorization.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clientId: client.client_id,
        redirectUri: client.redirect_uris[0],
        codeChallenge: 'challenge',
        scopes: ['portfolio:read'],
        state: 'client-state',
        resource: 'https://mcp.example.com/mcp',
      }),
    });
  });

  it('returns a one-time authorization code only for the configured admin identity', async () => {
    prisma.mcpOAuthAuthorization.findUnique.mockResolvedValue(transaction);
    prisma.mcpOAuthAuthorization.updateMany.mockResolvedValue({ count: 1 });

    const redirect = new URL(await service.finishAuthorization(transaction.id, 'owner-id'));
    const code = redirect.searchParams.get('code');
    expect(code).toMatch(/^[a-f0-9]{64}$/);
    expect(redirect.searchParams.get('state')).toBe('client-state');
    expect(prisma.mcpOAuthAuthorization.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: transaction.id }),
        data: { authorizationCodeHash: sha256(code ?? '') },
      })
    );
    expect(redirect.origin).toBe('http://127.0.0.1:4321');
  });

  it('denies authorization for any non-admin identity', async () => {
    prisma.mcpOAuthAuthorization.findUnique.mockResolvedValue(transaction);
    const redirect = new URL(await service.finishAuthorization(transaction.id, 'other-user'));

    expect(redirect.searchParams.get('error')).toBe('access_denied');
    expect(redirect.searchParams.get('state')).toBe('client-state');
    expect(redirect.searchParams.has('code')).toBe(false);
    expect(prisma.mcpOAuthAuthorization.delete).toHaveBeenCalledWith({ where: { id: transaction.id } });
  });

  it('checks PKCE challenge lookup and exchanges a single-use code for hashed tokens', async () => {
    const authorizationCode = 'one-time-code';
    prisma.mcpOAuthAuthorization.findUnique.mockResolvedValue({
      ...transaction,
      authorizationCodeHash: sha256(authorizationCode),
    });
    prisma.mcpOAuthAuthorization.updateMany.mockResolvedValue({ count: 1 });
    const createMany = jest.fn().mockResolvedValue({ count: 2 });
    prisma.$transaction.mockImplementation(async (callback) => callback({ mcpOAuthToken: { createMany } }));

    await expect(service.challengeForAuthorizationCode(client, authorizationCode)).resolves.toBe('test-challenge');
    const tokens = await service.exchangeAuthorizationCode(
      client,
      authorizationCode,
      'pkce-verifier',
      client.redirect_uris[0],
      new URL(transaction.resource)
    );

    expect(tokens.access_token).not.toBe(tokens.refresh_token);
    expect(prisma.mcpOAuthAuthorization.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          authorizationCodeHash: sha256(authorizationCode),
          usedAt: null,
        }),
      })
    );
    expect(createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ tokenHash: sha256(tokens.access_token), tokenType: 'ACCESS' }),
        expect.objectContaining({ tokenHash: sha256(tokens.refresh_token), tokenType: 'REFRESH' }),
      ]),
    });
    expect(JSON.stringify(createMany.mock.calls)).not.toContain(tokens.access_token);
    expect(JSON.stringify(createMany.mock.calls)).not.toContain(tokens.refresh_token);
  });

  it('rotates refresh tokens atomically and rejects replay', async () => {
    const refreshToken = 'refresh-token-value';
    const storedRefreshToken = {
      tokenHash: sha256(refreshToken),
      tokenType: 'REFRESH',
      clientId: client.client_id,
      scopes: ['portfolio:read'],
      resource: 'https://mcp.example.com/mcp',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    };
    prisma.mcpOAuthToken.findUnique.mockResolvedValueOnce(storedRefreshToken).mockResolvedValue({
      ...storedRefreshToken,
      revokedAt: new Date(),
    });
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const createMany = jest.fn().mockResolvedValue({ count: 2 });
    prisma.$transaction.mockImplementation(async (callback) => callback({ mcpOAuthToken: { updateMany, createMany } }));

    const tokens = await service.exchangeRefreshToken(client, refreshToken);
    expect(tokens.refresh_token).not.toBe(refreshToken);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash: sha256(refreshToken),
        tokenType: 'REFRESH',
        revokedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: { revokedAt: expect.any(Date) },
    });

    let refreshError: unknown;
    try {
      await service.exchangeRefreshToken(client, refreshToken);
    } catch (error) {
      refreshError = error;
    }
    expect(refreshError).toBeInstanceOf(InvalidGrantError);
  });

  it('verifies only unexpired, unrevoked access tokens for the MCP resource', async () => {
    const rawToken = 'access-token-value';
    prisma.mcpOAuthToken.findUnique.mockResolvedValue({
      tokenHash: sha256(rawToken),
      tokenType: 'ACCESS',
      clientId: client.client_id,
      scopes: ['portfolio:read'],
      resource: 'https://mcp.example.com/mcp',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    await expect(service.verifyAccessToken(rawToken)).resolves.toMatchObject({
      clientId: client.client_id,
      scopes: ['portfolio:read'],
      resource: new URL('https://mcp.example.com/mcp'),
    });
    expect(prisma.mcpOAuthToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: sha256(rawToken) },
    });

    prisma.mcpOAuthToken.findUnique.mockResolvedValue({
      tokenType: 'ACCESS',
      clientId: client.client_id,
      scopes: ['portfolio:read'],
      resource: 'https://mcp.example.com/mcp',
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
    });
    await expect(service.verifyAccessToken(rawToken)).rejects.toBeInstanceOf(InvalidTokenError);

    prisma.mcpOAuthToken.findUnique.mockResolvedValue({
      tokenType: 'ACCESS',
      clientId: client.client_id,
      scopes: ['portfolio:read'],
      resource: 'https://mcp.example.com/mcp',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    });
    await expect(service.verifyAccessToken(rawToken)).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('revokes only tokens owned by the requesting OAuth client', async () => {
    await service.revokeToken(client, { token: 'issued-token', token_type_hint: 'access_token' });

    expect(prisma.mcpOAuthToken.updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash: sha256('issued-token'),
        clientId: client.client_id,
        revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    });
  });
});

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
