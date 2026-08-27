import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactMessageDto {
  @ApiProperty({
    description: 'Unique identifier of the message',
    example: 'cly1x8f9z0000abcd1234efgh',
  })
  id: string;

  @ApiProperty({ example: 'Jane Doe' })
  fullName: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Acme Inc.' })
  organization?: string;

  @ApiProperty({ example: 'Freelance project inquiry' })
  subject: string;

  @ApiProperty({ example: "Hi, I'd like to discuss a project with you." })
  message: string;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ example: '2026-08-17T12:00:00.000Z' })
  createdAt: Date;
}
