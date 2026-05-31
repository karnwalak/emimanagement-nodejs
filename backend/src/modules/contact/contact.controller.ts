import { Controller, Post, Body, Req, HttpCode, HttpStatus, UseGuards, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { ContactService } from './contact.service';
import { SubmitContactDto } from './dto/submit-contact.dto';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Submit a contact/support form (public endpoint)' })
  async submit(@Body() dto: SubmitContactDto, @Req() req: Request) {
    const userId = (req as any).user?._id?.toString();
    await this.contactService.submit(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      userId,
    });
    return { message: 'Thank you for contacting us! We will get back to you within 24 hours.' };
  }
}
