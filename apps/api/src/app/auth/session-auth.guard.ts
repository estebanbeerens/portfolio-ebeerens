import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

export interface RequestWithGithubUser extends Request {
  githubUserId?: string;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithGithubUser>();
    const token = req.cookies?.session;
    if (!token) {
      throw new UnauthorizedException();
    }

    const session = await this.authService.validateSession(token);
    if (!session) {
      throw new UnauthorizedException();
    }

    req.githubUserId = session.githubUserId;
    return true;
  }
}
