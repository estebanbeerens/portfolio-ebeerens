import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MaxLength(200)
  fullName: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiPropertyOptional({ example: 'Acme Inc.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  organization?: string;

  @ApiProperty({ example: 'Freelance project inquiry' })
  @IsString()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: "Hi, I'd like to discuss a project with you." })
  @IsString()
  @MaxLength(5000)
  message: string;

  @ApiProperty({
    description: 'Token produced by the Cloudflare Turnstile widget on the contact form',
    maxLength: 2048,
  })
  @IsString()
  @MaxLength(2048)
  turnstileToken: string;
}
