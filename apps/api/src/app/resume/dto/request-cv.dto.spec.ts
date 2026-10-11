import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RequestCvDto } from './request-cv.dto';

describe('RequestCvDto', () => {
  it('allows anonymous downloads and strips blank optional fields', async () => {
    const dto = plainToInstance(RequestCvDto, { fullName: '  ', email: '', reason: '' });
    expect(await validate(dto)).toEqual([]);
    expect(dto.fullName).toBeUndefined();
    expect(dto.email).toBeUndefined();
  });

  it('trims details and rejects malformed email or non-boolean consent', async () => {
    const dto = plainToInstance(RequestCvDto, { fullName: ' Jane ', email: 'bad', consent: 'true' });
    expect(dto.fullName).toBe('Jane');
    expect((await validate(dto)).map((error) => error.property)).toEqual(['email', 'consent']);
  });
});
