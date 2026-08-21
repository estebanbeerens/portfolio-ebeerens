import { TestBed } from '@angular/core/testing';
import { ResumeDto, ResumeService } from '@portfolio-ebeerens/api-client';
import { ToastService } from '@portfolio-ebeerens/ui';
import { of, throwError } from 'rxjs';
import { ResumeUpload } from './resume-upload.component';

const resume: ResumeDto = {
  fileName: 'Alex_Mercer_Resume_2024.pdf',
  mimeType: 'application/pdf',
  fileSize: 430080,
  uploadedAt: '2024-03-12T00:00:00.000Z',
};

describe('ResumeUpload', () => {
  function configure(api: Partial<ResumeService>, toast = { success: vi.fn(), error: vi.fn() }) {
    TestBed.configureTestingModule({
      imports: [ResumeUpload],
      providers: [
        { provide: ResumeService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });
    return toast;
  }

  it('shows the active file when a resume exists', async () => {
    configure({ resumeControllerFindResume: vi.fn(() => of(resume)) as never });
    const fixture = TestBed.createComponent(ResumeUpload);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Alex_Mercer_Resume_2024.pdf');
  });

  it('renders the dropzone without an active file when none has been uploaded yet', async () => {
    configure({
      resumeControllerFindResume: vi.fn(() => throwError(() => ({ status: 404 }))) as never,
    });
    const fixture = TestBed.createComponent(ResumeUpload);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Drag & drop new resume file');
    expect(text).not.toContain('Active file');
  });

  it('rejects a non-PDF file before calling the API', async () => {
    const createUploadUrl = vi.fn();
    const toast = configure({
      resumeControllerFindResume: vi.fn(() => throwError(() => ({ status: 404 }))) as never,
      resumeControllerCreateUploadUrl: createUploadUrl as never,
    });
    const fixture = TestBed.createComponent(ResumeUpload);
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'resume.docx', { type: 'application/msword' });
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(createUploadUrl).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Only PDF files are supported for the resume.');
  });

  it('deletes the active resume', async () => {
    const remove = vi.fn(() => of(undefined));
    const toast = configure({
      resumeControllerFindResume: vi.fn(() => of(resume)) as never,
      resumeControllerRemove: remove as never,
    });
    const fixture = TestBed.createComponent(ResumeUpload);
    await fixture.whenStable();

    const deleteButton = fixture.nativeElement.querySelector('button[aria-label="Delete resume"]') as HTMLButtonElement;
    deleteButton.click();
    await fixture.whenStable();

    expect(remove).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Resume deleted.');
  });
});
