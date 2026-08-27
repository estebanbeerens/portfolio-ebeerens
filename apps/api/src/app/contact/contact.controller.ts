import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { ContactService } from './contact.service';
import { ContactMessageDto } from './dto/contact-message.dto';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'The message was submitted',
    type: ContactMessageDto,
  })
  @ApiBadRequestResponse({ description: 'Turnstile verification failed' })
  create(@Body() dto: CreateContactMessageDto) {
    return this.contactService.create(dto);
  }

  @Get()
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({
    description: 'All submitted contact messages',
    type: [ContactMessageDto],
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  findAll() {
    return this.contactService.findAll();
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'The message was deleted' })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  remove(@Param('id') id: string) {
    return this.contactService.remove(id);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({
    description: 'The message was updated',
    type: ContactMessageDto,
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  @ApiNotFoundResponse({ description: 'The message was not found' })
  update(@Param('id') id: string, @Body() dto: UpdateContactMessageDto) {
    return this.contactService.update(id, dto);
  }
}
