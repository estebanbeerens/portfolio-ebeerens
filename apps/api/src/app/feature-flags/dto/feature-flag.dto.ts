import { ApiProperty } from '@nestjs/swagger';
import { FeatureFlagKey } from '../../../generated/prisma/enums';

export class FeatureFlagDto {
  @ApiProperty({ enum: FeatureFlagKey, example: FeatureFlagKey.PROJECTS })
  key: FeatureFlagKey;

  @ApiProperty({ example: false })
  enabled: boolean;

  @ApiProperty({ example: '2026-08-17T12:00:00.000Z' })
  updatedAt: Date;
}
