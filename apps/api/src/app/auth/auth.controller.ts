import { Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiExcludeEndpoint,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { MeResponseDto } from './dto/me-response.dto';
import { GithubAuthGuard } from './github-auth.guard';
import { RequestWithGithubUser, SessionAuthGuard } from './session-auth.guard';

const SESSION_COOKIE = 'session';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('github')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('github'))
  githubLogin() {
    // Passport redirects to GitHub before this body ever runs.
  }

  @Get('github/callback')
  @ApiExcludeEndpoint()
  @UseGuards(GithubAuthGuard)
  async githubCallback(
    @Req()
    req: RequestWithGithubUser & {
      user?: { githubUserId: string; displayName: string; avatarUrl?: string };
    },
    @Res() res: Response
  ) {
    const adminAppUrl = process.env.ADMIN_APP_URL;
    if (!req.user) {
      return res.redirect(`${adminAppUrl}/?error=unauthorized`);
    }

    const { token, expiresAt } = await this.authService.createSession(
      req.user.githubUserId,
      req.user.displayName,
      req.user.avatarUrl
    );
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt,
    });
    return res.redirect(`${adminAppUrl}/`);
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Session ended' })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  async logout(@Req() req: RequestWithGithubUser, @Res() res: Response) {
    await this.authService.destroySession(req.cookies?.session);
    res.clearCookie(SESSION_COOKIE);
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({
    description: 'The current admin session',
    type: MeResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  me(@Req() req: RequestWithGithubUser): MeResponseDto {
    return {
      githubUserId: req.githubUserId as string,
      displayName: req.displayName ?? (req.githubUserId as string),
      avatarUrl: req.avatarUrl,
    };
  }
}
