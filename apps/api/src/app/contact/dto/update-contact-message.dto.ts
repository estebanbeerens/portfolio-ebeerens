import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateContactMessageDto {
  @ApiProperty({ example: true, description: 'Whether the message has been read' })
  @IsBoolean()
  isRead: boolean;
}
