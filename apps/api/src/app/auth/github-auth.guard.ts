import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  // Don't let passport throw a raw 401 on rejection — let the callback route
  // redirect to a friendly admin-app error page instead.
  override handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    return user;
  }
}
