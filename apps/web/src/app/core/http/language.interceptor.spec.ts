import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { languageInterceptor } from './language.interceptor';

describe('languageInterceptor', () => {
  it("sets the X-Accept-Language header to the app's LOCALE_ID", () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([languageInterceptor])),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'nl' },
      ],
    });

    TestBed.inject(HttpClient).get('/api/profile/public-portfolio').subscribe();

    const req = TestBed.inject(HttpTestingController).expectOne('/api/profile/public-portfolio');
    expect(req.request.headers.get('X-Accept-Language')).toBe('nl');
  });
});
