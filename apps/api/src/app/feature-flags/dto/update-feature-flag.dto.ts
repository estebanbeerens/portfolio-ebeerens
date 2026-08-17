import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateFeatureFlagDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}
