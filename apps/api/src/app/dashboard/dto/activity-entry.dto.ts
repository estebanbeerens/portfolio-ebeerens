import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityAction, ActivityEntity } from '../../../generated/prisma/enums';

export class ActivityEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ActivityEntity, enumName: 'ActivityEntity' })
  entityType!: ActivityEntity;

  @ApiPropertyOptional()
  entityId?: string;

  @ApiProperty({ enum: ActivityAction, enumName: 'ActivityAction' })
  action!: ActivityAction;

  @ApiProperty()
  summary!: string;

  @ApiPropertyOptional()
  actor?: string;

  @ApiProperty()
  createdAt!: Date;
}
