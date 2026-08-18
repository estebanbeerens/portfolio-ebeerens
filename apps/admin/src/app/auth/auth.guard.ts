import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, type CanActivateFn } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { SessionService } from './session.service';

export const authGuard: CanActivateFn = () => {
  // The session can only be resolved in the browser; the shell renders client-side anyway.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }

  const session = inject(SessionService);
  const router = inject(Router);

  return toObservable(session.state).pipe(
    filter((state) => state !== 'checking'),
    take(1),
    map((state) => state === 'authenticated' || router.createUrlTree(['/login']))
  );
};
