import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class TurnstileVerifier {
  async verify(token: string, action: string): Promise<void> {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      throw new BadRequestException('Turnstile verification is unavailable');
    }
    let result: { success: boolean; action?: string; hostname?: string };
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(5000),
      });
      result = await response.json();
    } catch {
      throw new BadRequestException('Turnstile verification failed');
    }
    const hostnames = (process.env.TURNSTILE_EXPECTED_HOSTNAME || '')
      .split(',')
      .map((host) => host.trim())
      .filter(Boolean);
    if (
      !result.success ||
      result.action !== action ||
      (hostnames.length && !hostnames.includes(result.hostname || ''))
    ) {
      throw new BadRequestException('Turnstile verification failed');
    }
  }
}
