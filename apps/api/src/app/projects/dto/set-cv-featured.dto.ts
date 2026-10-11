import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetCvFeaturedDto {
  @ApiProperty()
  @IsBoolean()
  isCvFeatured: boolean;
}
