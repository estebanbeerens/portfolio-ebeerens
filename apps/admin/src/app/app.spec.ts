import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '@portfolio-ebeerens/api-client';
import { App } from './app';

describe('App', () => {
  function configure(authService: Partial<AuthService>) {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: AuthService, useValue: authService }],
    });
  }

  it('shows the logout button once the session check succeeds', async () => {
    configure({
      authControllerMe: () => of({ githubUserId: '12345' }) as never,
    });

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Logged in as 12345');
    expect(compiled.querySelector('button')).toBeTruthy();
  });

  it('shows a "Log in with GitHub" link when there is no valid session', async () => {
    configure({
      authControllerMe: () => throwError(() => new Error('401')) as never,
    });

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector<HTMLAnchorElement>('a.login-button');
    expect(link?.textContent).toContain('Log in with GitHub');
    expect(link?.getAttribute('href')).toBe('/api/auth/github');
  });
});
