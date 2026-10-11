import { GUARDS_METADATA } from '@nestjs/common/constants';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { ResumeController } from './resume.controller';

describe('ResumeController', () => {
  it('guards every requester administration and preview endpoint', () => {
    for (const method of ['findRequests', 'removeRequest', 'preview'] as const) {
      expect(Reflect.getMetadata(GUARDS_METADATA, ResumeController.prototype[method])).toContain(SessionAuthGuard);
    }
    expect(Reflect.getMetadata(GUARDS_METADATA, ResumeController.prototype.requestDownload)).toBeUndefined();
  });
});
