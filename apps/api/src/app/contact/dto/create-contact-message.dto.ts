import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MaxLength(200)
  fullName: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty({ example: 'Freelance project inquiry' })
  @IsString()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: "Hi, I'd like to discuss a project with you." })
  @IsString()
  @MaxLength(5000)
  message: string;

  @ApiProperty({
    description: 'Token produced by the reCAPTCHA widget on the contact form',
  })
  @IsString()
  recaptchaToken: string;
}
