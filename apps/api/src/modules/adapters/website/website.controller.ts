import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { WebsiteAdapterService } from './website.service';

class CreateSessionDto {
  @IsString()
  publicKey!: string;
}

class SendMessageDto {
  @IsString()
  @MinLength(1)
  text!: string;
}

@Controller('public/chat')
export class WebsiteAdapterController {
  constructor(private readonly website: WebsiteAdapterService) {}

  @Post('sessions')
  createSession(
    @Body() dto: CreateSessionDto,
    @Headers('origin') origin?: string,
  ) {
    return this.website.createSession(dto.publicKey, origin);
  }

  @Post('sessions/:id/messages')
  sendMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @Headers('x-public-key') publicKey?: string,
    @Headers('origin') origin?: string,
  ) {
    if (!publicKey) throw new BadRequestException('x-public-key required');
    return this.website.sendMessage(publicKey, conversationId, dto.text, origin);
  }
}
