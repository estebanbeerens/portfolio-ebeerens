import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { generateSessionToken, hashToken } from './token.util';

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(githubUserId: string, displayName: string, avatarUrl?: string) {
    const { token, tokenHash } = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.prisma.session.create({
      // Prisma columns are nullable; null is the storage representation of "absent".
      data: { tokenHash, githubUserId, displayName, avatarUrl: avatarUrl ?? null, expiresAt },
    });
    return { token, expiresAt };
  }

  async validateSession(token: string) {
    const tokenHash = hashToken(token);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
    });
    if (!session || session.expiresAt < new Date()) {
      return undefined;
    }
    return {
      ...session,
      displayName: session.displayName ?? undefined,
      avatarUrl: session.avatarUrl ?? undefined,
    };
  }

  async destroySession(token: string) {
    const tokenHash = hashToken(token);
    await this.prisma.session.deleteMany({ where: { tokenHash } });
  }

  async purgeExpiredSessions() {
    await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
