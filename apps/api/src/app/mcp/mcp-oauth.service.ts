import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomBytes, createHash } from 'node:crypto';
import { Response } from 'express';
import {
  OAuthClientInformationFull,
  OAuthClientInformationFullSchema,
  OAuthTokenRevocationRequest,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import {
  InvalidClientMetadataError,
  InvalidGrantError,
  InvalidRequestError,
  InvalidTokenError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { AuthorizationParams, OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma.service';

const READ_SCOPE = 'portfolio:read';
const AUTHORIZATION_TTL_MS = 10 * 60 * 1000;
const ACCESS_TTL_SECONDS = 60 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
const AUTHORIZATION_COOKIE = 'mcp_oauth_transaction';

@Injectable()
export class McpOAuthService implements OAuthServerProvider, OAuthRegisteredClientsStore {
  constructor(private readonly prisma: PrismaService) {}

  get clientsStore(): OAuthRegisteredClientsStore {
    return this;
  }

  get authorizationCookieName(): string {
    return AUTHORIZATION_COOKIE;
  }

  async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
    const row = await this.prisma.mcpOAuthClient.findUnique({ where: { id: clientId } });
    if (!row) {
      return undefined;
    }
    return OAuthClientInformationFullSchema.parse(row.clientMetadata);
  }

  async registerClient(client: OAuthClientInformationFull): Promise<OAuthClientInformationFull> {
    if (client.token_endpoint_auth_method !== 'none') {
      throw new InvalidClientMetadataError('Only public OAuth clients are supported');
    }
    if (
      !client.grant_types?.includes('authorization_code') ||
      !client.grant_types.includes('refresh_token') ||
      !client.response_types?.includes('code')
    ) {
      throw new InvalidClientMetadataError('Clients must support the authorization code grant');
    }

    await this.prisma.mcpOAuthClient.create({
      data: {
        id: client.client_id,
        clientMetadata: JSON.parse(JSON.stringify(client)) as Prisma.InputJsonValue,
      },
    });
    return client;
  }

  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    const resource = this.resourceUrl;
    if (params.resource && params.resource.href !== resource.href) {
      throw new InvalidRequestError('The requested resource is not supported');
    }
    if (params.scopes?.some((scope) => scope !== READ_SCOPE)) {
      throw new InvalidRequestError('The requested scope is not supported');
    }
    if (!client.redirect_uris.includes(params.redirectUri)) {
      throw new InvalidRequestError('The redirect URI is not registered');
    }

    const transactionId = randomBytes(32).toString('hex');
    await this.prisma.mcpOAuthAuthorization.create({
      data: {
        id: transactionId,
        clientId: client.client_id,
        redirectUri: params.redirectUri,
        codeChallenge: params.codeChallenge,
        scopes: [READ_SCOPE],
        resource: resource.href,
        state: params.state ?? null,
        expiresAt: new Date(Date.now() + AUTHORIZATION_TTL_MS),
      },
    });

    const adminAppUrl = process.env.ADMIN_APP_URL;
    if (!adminAppUrl) {
      throw new Error('ADMIN_APP_URL must be configured for MCP OAuth authorization');
    }
    const startUrl = new URL('/api/mcp/oauth/start', adminAppUrl);
    startUrl.searchParams.set('transactionId', transactionId);
    res.redirect(startUrl.toString());
  }

  async assertPendingAuthorization(transactionId: string): Promise<void> {
    if (!/^[a-f0-9]{64}$/.test(transactionId)) {
      throw new InvalidGrantError('The authorization request is invalid or expired');
    }
    const transaction = await this.prisma.mcpOAuthAuthorization.findUnique({ where: { id: transactionId } });
    if (
      !transaction ||
      transaction.authorizationCodeHash ||
      transaction.usedAt ||
      transaction.expiresAt <= new Date()
    ) {
      throw new InvalidGrantError('The authorization request is invalid or expired');
    }
  }

  async finishAuthorization(transactionId: string, githubUserId?: string): Promise<string> {
    if (!/^[a-f0-9]{64}$/.test(transactionId)) {
      throw new InvalidGrantError('The authorization request is invalid or expired');
    }
    const transaction = await this.prisma.mcpOAuthAuthorization.findUnique({ where: { id: transactionId } });
    if (
      !transaction ||
      transaction.authorizationCodeHash ||
      transaction.usedAt ||
      transaction.expiresAt <= new Date()
    ) {
      throw new InvalidGrantError('The authorization request is invalid or expired');
    }

    const redirectUrl = new URL(transaction.redirectUri);
    if (!githubUserId || githubUserId !== process.env.ADMIN_GITHUB_ID) {
      await this.prisma.mcpOAuthAuthorization.delete({ where: { id: transactionId } });
      redirectUrl.searchParams.set('error', 'access_denied');
      if (transaction.state) {
        redirectUrl.searchParams.set('state', transaction.state);
      }
      return redirectUrl.toString();
    }

    const authorizationCode = randomBytes(32).toString('hex');
    const result = await this.prisma.mcpOAuthAuthorization.updateMany({
      where: {
        id: transactionId,
        authorizationCodeHash: null,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { authorizationCodeHash: hashToken(authorizationCode) },
    });
    if (result.count !== 1) {
      throw new InvalidGrantError('The authorization request is invalid or expired');
    }

    redirectUrl.searchParams.set('code', authorizationCode);
    if (transaction.state) {
      redirectUrl.searchParams.set('state', transaction.state);
    }
    return redirectUrl.toString();
  }

  async challengeForAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    const transaction = await this.findAuthorizationCode(authorizationCode);
    if (!transaction || transaction.clientId !== client.client_id || transaction.expiresAt <= new Date()) {
      throw new InvalidGrantError('The authorization code is invalid or expired');
    }
    return transaction.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string,
    resource?: URL
  ): Promise<OAuthTokens> {
    const transaction = await this.findAuthorizationCode(authorizationCode);
    if (
      !transaction ||
      transaction.clientId !== client.client_id ||
      transaction.expiresAt <= new Date() ||
      transaction.usedAt ||
      transaction.redirectUri !== redirectUri ||
      transaction.resource !== this.resourceUrl.href ||
      (resource && resource.href !== transaction.resource)
    ) {
      throw new InvalidGrantError('The authorization code is invalid or expired');
    }

    const consumed = await this.prisma.mcpOAuthAuthorization.updateMany({
      where: {
        id: transaction.id,
        authorizationCodeHash: hashToken(authorizationCode),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) {
      throw new InvalidGrantError('The authorization code has already been used');
    }

    return this.issueTokens(client.client_id, transaction.scopes, transaction.resource);
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    resource?: URL
  ): Promise<OAuthTokens> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.mcpOAuthToken.findUnique({ where: { tokenHash } });
    if (
      !stored ||
      stored.tokenType !== 'REFRESH' ||
      stored.clientId !== client.client_id ||
      stored.revokedAt ||
      stored.expiresAt <= new Date() ||
      stored.resource !== this.resourceUrl.href ||
      (resource && resource.href !== stored.resource) ||
      (scopes && (scopes.length === 0 || scopes.some((scope) => !stored.scopes.includes(scope))))
    ) {
      throw new InvalidGrantError('The refresh token is invalid or expired');
    }

    return this.prisma.$transaction(async (transaction) => {
      const revoked = await transaction.mcpOAuthToken.updateMany({
        where: { tokenHash, tokenType: 'REFRESH', revokedAt: null, expiresAt: { gt: new Date() } },
        data: { revokedAt: new Date() },
      });
      if (revoked.count !== 1) {
        throw new InvalidGrantError('The refresh token has already been used');
      }
      return this.createTokenPair(transaction, client.client_id, scopes ?? stored.scopes, stored.resource);
    });
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const stored = await this.prisma.mcpOAuthToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (
      !stored ||
      stored.tokenType !== 'ACCESS' ||
      stored.revokedAt ||
      stored.expiresAt <= new Date() ||
      stored.resource !== this.resourceUrl.href
    ) {
      throw new InvalidTokenError('The access token is invalid or expired');
    }
    return {
      token,
      clientId: stored.clientId,
      scopes: stored.scopes,
      expiresAt: Math.floor(stored.expiresAt.getTime() / 1000),
      resource: new URL(stored.resource),
    };
  }

  async revokeToken(client: OAuthClientInformationFull, request: OAuthTokenRevocationRequest): Promise<void> {
    await this.prisma.mcpOAuthToken.updateMany({
      where: {
        tokenHash: hashToken(request.token),
        clientId: client.client_id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeExpiredOAuthRecords(): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.mcpOAuthAuthorization.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.mcpOAuthToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    ]);
  }

  private get resourceUrl(): URL {
    const configuredUrl = process.env.MCP_PUBLIC_URL;
    const baseUrl = configuredUrl ?? (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000');
    if (!baseUrl) {
      throw new Error('MCP_PUBLIC_URL must be configured in production');
    }
    const url = new URL('/mcp', baseUrl);
    if (url.protocol !== 'https:' && !(url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
      throw new Error('MCP_PUBLIC_URL must use HTTPS except on localhost');
    }
    return url;
  }

  private async findAuthorizationCode(authorizationCode: string) {
    return this.prisma.mcpOAuthAuthorization.findUnique({
      where: { authorizationCodeHash: hashToken(authorizationCode) },
    });
  }

  private async issueTokens(clientId: string, scopes: string[], resource: string): Promise<OAuthTokens> {
    return this.prisma.$transaction((transaction) => this.createTokenPair(transaction, clientId, scopes, resource));
  }

  private async createTokenPair(
    transaction: Prisma.TransactionClient,
    clientId: string,
    scopes: string[],
    resource: string
  ): Promise<OAuthTokens> {
    const accessToken = randomBytes(32).toString('hex');
    const refreshToken = randomBytes(32).toString('hex');
    const now = Date.now();
    await transaction.mcpOAuthToken.createMany({
      data: [
        {
          tokenHash: hashToken(accessToken),
          clientId,
          tokenType: 'ACCESS',
          scopes,
          resource,
          expiresAt: new Date(now + ACCESS_TTL_SECONDS * 1000),
        },
        {
          tokenHash: hashToken(refreshToken),
          clientId,
          tokenType: 'REFRESH',
          scopes,
          resource,
          expiresAt: new Date(now + REFRESH_TTL_SECONDS * 1000),
        },
      ],
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: ACCESS_TTL_SECONDS,
      scope: scopes.join(' '),
    };
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
