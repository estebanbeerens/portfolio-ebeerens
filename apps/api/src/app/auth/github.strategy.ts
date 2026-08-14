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

  // Reject here — never let a non-admin identity reach the controller.
  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): { githubUserId: string } | null {
    const githubUserId = profile.id;
    if (githubUserId !== process.env.ADMIN_GITHUB_ID) {
      return null;
    }
    return { githubUserId };
  }
}
