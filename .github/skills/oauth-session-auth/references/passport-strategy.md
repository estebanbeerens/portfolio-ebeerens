# Passport GitHub Strategy Setup

## Packages

```
npm install passport passport-github2 @nestjs/passport
npm install -D @types/passport-github2
```

## Strategy

```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['read:user'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const githubUserId = profile.id;
    if (githubUserId !== process.env.ADMIN_GITHUB_ID) {
      // Reject here — never create a session for a non-admin account.
      return null;
    }
    return { githubUserId };
  }
}
```

- Returning `null`/throwing from `validate()` is the rejection point — don't let a non-admin identity reach the controller and rely on a later check.
- `scope: ['read:user']` is enough to get the GitHub user ID; don't request broader scopes than needed.

## Controller

```ts
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {
    // Passport handles the redirect to GitHub.
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res: Response) {
    if (!req.user) {
      return res.redirect('/admin/login?error=unauthorized');
    }
    const { token, expiresAt } = await this.authService.createSession(req.user.githubUserId);
    res.cookie('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: expiresAt,
    });
    return res.redirect('/admin');
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard)
  async logout(@Req() req, @Res() res: Response) {
    await this.authService.destroySession(req.sessionToken);
    res.clearCookie('session');
    return res.status(204).send();
  }
}
```

## Module Wiring

Register the strategy as a provider in the owning module (e.g. an `AuthModule`) alongside `PassportModule.register({ defaultStrategy: 'github' })`. Keep `AuthService` responsible for all Prisma/session logic — the controller only orchestrates, matching the `nestjs-backend` skill's controller/service split.
