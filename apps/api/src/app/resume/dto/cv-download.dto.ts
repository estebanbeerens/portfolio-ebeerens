import { ApiProperty } from '@nestjs/swagger';

export class CvDownloadDto {
  @ApiProperty()
  downloadUrl: string;

  @ApiProperty({ enum: ['not-requested', 'recorded', 'failed'] })
  loggingStatus: 'not-requested' | 'recorded' | 'failed';
}
