import { LOCALE_ID, inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

// Tells the API which language's content to return, derived from the built @angular/localize bundle's locale.
export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const locale = inject(LOCALE_ID);
  return next(req.clone({ setHeaders: { 'X-Accept-Language': locale } }));
};
