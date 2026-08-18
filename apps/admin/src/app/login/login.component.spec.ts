import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '@portfolio-ebeerens/api-client';
import { Login } from './login.component';

describe('Login', () => {
  function configure(authService: Partial<AuthService>) {
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });
  }

  it('offers a link to the dashboard once the session check succeeds', async () => {
    configure({ authControllerMe: () => of({ githubUserId: '12345', displayName: 'Alex Mercer' }) as never });

    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Logged in as Alex Mercer');
    expect(compiled.querySelector('a[href="/dashboard"]')).toBeTruthy();
  });

  it('shows a "Log in with GitHub" link when there is no valid session', async () => {
    configure({ authControllerMe: () => throwError(() => new Error('401')) as never });

    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a[href="/api/auth/github"]');
    expect(link?.textContent).toContain('Log in with GitHub');
  });
});
