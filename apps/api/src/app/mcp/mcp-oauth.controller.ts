import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { McpOAuthService } from './mcp-oauth.service';

@ApiExcludeController()
@Controller('mcp/oauth')
export class McpOAuthController {
  constructor(private readonly oauth: McpOAuthService) {}

  @Get('start')
  async start(@Query('transactionId') transactionId: string, @Res() response: Response) {
    await this.oauth.assertPendingAuthorization(transactionId);
    response.cookie(this.oauth.authorizationCookieName, transactionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/api/auth/github/callback',
    });
    return response.redirect('/api/auth/github');
  }
}
