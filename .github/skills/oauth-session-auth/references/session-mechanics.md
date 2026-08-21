# Session Token Mechanics

## Generating & Storing the Token

```ts
import { randomBytes, createHash } from 'node:crypto';

function generateSessionToken() {
  const token = randomBytes(32).toString('hex'); // raw value — goes in the cookie only
  const tokenHash = createHash('sha256').update(token).digest('hex'); // stored value
  return { token, tokenHash };
}
```

- The raw `token` is returned to the browser in the cookie and **never persisted**.
- Only `tokenHash` is written to the `Session` row (`tokenHash`, `githubUserId`, `expiresAt`, `createdAt` — matches the existing Prisma model).
- Hashing means a database read (backup, leak, etc.) doesn't hand out valid session tokens.

## Creating a Session

```ts
async createSession(githubUserId: string) {
  const { token, tokenHash } = generateSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  await this.prisma.session.create({
    data: { tokenHash, githubUserId, expiresAt },
  });
  return { token, expiresAt };
}
```

## Validating a Session (Auth Guard)

```ts
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.session;
    if (!token) return false;

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await this.prisma.session.findUnique({ where: { tokenHash } });
    if (!session || session.expiresAt < new Date()) return false;

    req.githubUserId = session.githubUserId;
    return true;
  }
}
```

Apply `@UseGuards(SessionAuthGuard)` to every admin-only controller/route — never rely on the frontend hiding a button as the actual access control.

## Logout

```ts
async destroySession(token: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await this.prisma.session.deleteMany({ where: { tokenHash } });
}
```

Deleting the row is the entire revocation mechanism — no blocklist needed.

## Expired Session Cleanup

Use `@nestjs/schedule` for a periodic cleanup job rather than a separate worker process:

```ts
@Injectable()
export class SessionCleanupService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredSessions() {
    await this.prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }
}
```

Register `ScheduleModule.forRoot()` once at the app module level for this to work.
