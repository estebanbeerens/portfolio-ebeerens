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
    profile: Profile
  ): { githubUserId: string; displayName: string; avatarUrl?: string } | undefined {
    const githubUserId = profile.id;
    if (githubUserId !== process.env.ADMIN_GITHUB_ID) {
      return undefined;
    }
    return {
      githubUserId,
      displayName: profile.displayName || profile.username || githubUserId,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
