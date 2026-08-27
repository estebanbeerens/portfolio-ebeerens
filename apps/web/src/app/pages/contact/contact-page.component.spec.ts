import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ContactMessageDto, ContactService, CreateContactMessageDto } from '@portfolio-ebeerens/api-client';
import { NgxTurnstileComponent } from 'ngx-turnstile';
import { of, throwError } from 'rxjs';
import { PortfolioContentService } from '../../shared/portfolio-content.service';
import { ContactPage } from './contact-page.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-turnstile',
  standalone: true,
  template: '',
})
class TurnstileStub {
  @Input() siteKey = '';
  @Input() action = '';
  @Input() theme = '';
  @Input() size = '';
  @Input() tabIndex = 0;
  @Input() responseField = true;
  @Output() resolved = new EventEmitter<string | null>();
  @Output() errored = new EventEmitter<string | null>();
  @Output() timeout = new EventEmitter<void>();
  @Output() unsupported = new EventEmitter<void>();

  reset = vi.fn();
}

describe('ContactPage', () => {
  async function createComponent(
    options: {
      create?: (dto: CreateContactMessageDto) => ReturnType<ContactService['contactControllerCreate']>;
    } = {}
  ) {
    const contactService = {
      contactControllerCreate: vi.fn(options.create ?? (() => of({ id: 'message-1' } as ContactMessageDto))),
    };
    await TestBed.configureTestingModule({
      imports: [ContactPage, HttpClientTestingModule],
      providers: [
        { provide: ContactService, useValue: contactService },
        {
          provide: PortfolioContentService,
          useValue: {
            profileValue: () => ({
              id: 'profile-1',
              name: 'John Beerens',
              headline: 'Frontend Engineer',
              location: 'Amsterdam, Netherlands',
              updatedAt: '2026-01-01',
            }),
          },
        },
      ],
    })
      .overrideComponent(ContactPage, {
        remove: { imports: [NgxTurnstileComponent] },
        add: { imports: [TurnstileStub] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(ContactPage);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/runtime-config.json').flush({ turnstileSiteKey: 'site-key' });
    fixture.detectChanges();

    return { fixture, contactService };
  }

  function fillValidForm(fixture: ComponentFixture<ContactPage>) {
    fixture.componentInstance['form'].setValue({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      organization: 'Acme Inc.',
      subject: 'Project inquiry',
      message: 'Can we talk about a project?',
    });
    fixture.detectChanges();
  }

  function turnstileStub(fixture: ComponentFixture<ContactPage>): TurnstileStub {
    return fixture.debugElement.query(By.directive(TurnstileStub)).componentInstance as TurnstileStub;
  }

  it('renders the form card on the left and profile card on the right', async () => {
    const { fixture } = await createComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Get In Touch');
    expect(compiled.textContent).toContain('Send a message');
    expect(compiled.textContent).toContain('John Beerens');
    expect(compiled.textContent).toContain('Frontend Engineer');
    expect(compiled.querySelector('label[for="contact-full-name"]')?.textContent).toContain('Full name');
    expect((compiled.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(false);
  });

  it('keeps submit clickable and reveals form errors when the form is invalid', async () => {
    const { fixture, contactService } = await createComponent();

    (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new SubmitEvent('submit'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect((compiled.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(false);
    expect(compiled.textContent).toContain('Enter your name');
    expect(compiled.textContent).toContain('Enter a valid email address');
    expect(compiled.textContent).toContain('Complete the required fields before sending.');
    expect(contactService.contactControllerCreate).not.toHaveBeenCalled();
  });

  it('submits the generated API payload with the Turnstile token', async () => {
    const { fixture, contactService } = await createComponent();
    fillValidForm(fixture);
    const turnstile = turnstileStub(fixture);
    turnstile.resolved.emit('turnstile-token');
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new SubmitEvent('submit'));
    fixture.detectChanges();

    expect(contactService.contactControllerCreate).toHaveBeenCalledWith(
      {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        organization: 'Acme Inc.',
        subject: 'Project inquiry',
        message: 'Can we talk about a project?',
        turnstileToken: 'turnstile-token',
      },
      'body',
      false,
      { transferCache: false }
    );
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Message sent');
    expect(compiled.querySelector('form')).toBeNull();
    expect(turnstile.reset).toHaveBeenCalled();
  });

  it('keeps showing the success panel even if resetting the widget re-fires a Turnstile event', async () => {
    const { fixture } = await createComponent();
    fillValidForm(fixture);
    const turnstile = turnstileStub(fixture);
    turnstile.resolved.emit('turnstile-token');
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new SubmitEvent('submit'));
    fixture.detectChanges();

    // simulate ngx-turnstile's widget firing `timeout`/`errored` as a side effect of our own `.reset()` call
    turnstile.timeout.emit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Message sent');
    expect(compiled.querySelector('form')).toBeNull();
  });

  it('clears the token when Turnstile expires or errors', async () => {
    const { fixture } = await createComponent();
    fillValidForm(fixture);
    const turnstile = turnstileStub(fixture);
    turnstile.resolved.emit('turnstile-token');
    fixture.detectChanges();

    turnstile.timeout.emit();
    fixture.detectChanges();

    expect(
      ((fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]') as HTMLButtonElement).disabled
    ).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Complete the verification before sending.');
  });

  it('shows a generic error when the API rejects submission, linked to the form for a11y', async () => {
    const { fixture } = await createComponent({ create: () => throwError(() => new Error('server error')) });
    fillValidForm(fixture);
    const turnstile = turnstileStub(fixture);
    turnstile.resolved.emit('turnstile-token');
    fixture.detectChanges();

    const form = (fixture.nativeElement as HTMLElement).querySelector('form');
    form?.dispatchEvent(new SubmitEvent('submit'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorBanner = compiled.querySelector('#contact-form-error');
    expect(errorBanner?.textContent).toContain('Something went wrong. Please try again.');
    expect(errorBanner?.getAttribute('role')).toBe('alert');
    expect(form?.getAttribute('aria-describedby')).toBe('contact-form-error');
    expect((compiled.querySelector('#contact-full-name') as HTMLInputElement)?.value).toBe('Jane Doe');
    expect(turnstile.reset).toHaveBeenCalled();
  });

  it('keeps showing the error banner even if resetting the widget re-fires a Turnstile event', async () => {
    const { fixture } = await createComponent({ create: () => throwError(() => new Error('server error')) });
    fillValidForm(fixture);
    const turnstile = turnstileStub(fixture);
    turnstile.resolved.emit('turnstile-token');
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new SubmitEvent('submit'));
    fixture.detectChanges();

    // simulate ngx-turnstile's widget firing `timeout`/`errored` as a side effect of our own `.reset()` call
    turnstile.timeout.emit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#contact-form-error')?.textContent).toContain(
      'Something went wrong. Please try again.'
    );
  });

  it('shows the specific API error message when provided', async () => {
    const { fixture } = await createComponent({
      create: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { message: 'Turnstile verification failed' },
            })
        ),
    });
    fillValidForm(fixture);
    const turnstile = turnstileStub(fixture);
    turnstile.resolved.emit('turnstile-token');
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new SubmitEvent('submit'));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Turnstile verification failed');
  });

  it('shows a verification configuration error when the runtime site key is missing', async () => {
    const contactService = { contactControllerCreate: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ContactPage, HttpClientTestingModule],
      providers: [
        { provide: ContactService, useValue: contactService },
        { provide: PortfolioContentService, useValue: { profileValue: () => undefined } },
      ],
    })
      .overrideComponent(ContactPage, {
        remove: { imports: [NgxTurnstileComponent] },
        add: { imports: [TurnstileStub] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(ContactPage);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/runtime-config.json').flush({});
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Contact verification is not configured.');
    expect(
      ((fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]') as HTMLButtonElement).disabled
    ).toBe(false);
  });
});
