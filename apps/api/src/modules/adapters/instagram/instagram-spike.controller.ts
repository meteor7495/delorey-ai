import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentAuth, SessionAuthGuard } from '../../platform/auth.guard';
import type { AuthContext } from '../../platform/auth.guard';
import { InstagramSpikeService } from './instagram-spike.service';

class ButtonDto {
  @IsIn(['postback', 'web_url'])
  type!: 'postback' | 'web_url';

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  payload?: string;

  @IsOptional()
  @IsString()
  url?: string;
}

class SendMessageDto {
  @IsString()
  @MinLength(1)
  accountId!: string;

  @IsString()
  @MinLength(1)
  recipientId!: string;

  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ButtonDto)
  buttons?: ButtonDto[];
}

class ReplyCommentDto {
  @IsString()
  @MinLength(1)
  accountId!: string;

  @IsString()
  @MinLength(1)
  commentId!: string;

  @IsString()
  @MinLength(1)
  message!: string;
}

class FollowStatusDto {
  @IsString()
  @MinLength(1)
  accountId!: string;

  @IsString()
  @MinLength(1)
  customerId!: string;
}

class ListPostsDto {
  @IsString()
  @MinLength(1)
  accountId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * BoxAPI Instagram Official API — evaluation spike only.
 * Does NOT wire Runtime / Commerce / Handoff.
 */
@Controller()
export class InstagramSpikeController {
  constructor(private readonly spike: InstagramSpikeService) {}

  @Get('spike/boxapi')
  @UseGuards(SessionAuthGuard)
  status(@CurrentAuth() _auth: AuthContext) {
    return this.spike.status();
  }

  @Get('spike/boxapi/info')
  @UseGuards(SessionAuthGuard)
  info(@CurrentAuth() _auth: AuthContext) {
    return this.spike.serviceInfo();
  }

  @Get('spike/boxapi/accounts')
  @UseGuards(SessionAuthGuard)
  accounts(@CurrentAuth() _auth: AuthContext) {
    return this.spike.listAccounts();
  }

  @Post('spike/boxapi/send-message')
  @UseGuards(SessionAuthGuard)
  send(@CurrentAuth() _auth: AuthContext, @Body() dto: SendMessageDto) {
    return this.spike.sendMessage(dto);
  }

  @Post('spike/boxapi/reply-comment')
  @UseGuards(SessionAuthGuard)
  reply(@CurrentAuth() _auth: AuthContext, @Body() dto: ReplyCommentDto) {
    return this.spike.replyComment(dto);
  }

  @Post('spike/boxapi/follow-status')
  @UseGuards(SessionAuthGuard)
  follow(@CurrentAuth() _auth: AuthContext, @Body() dto: FollowStatusDto) {
    return this.spike.followStatus(dto.accountId, dto.customerId);
  }

  @Post('spike/boxapi/list-posts')
  @UseGuards(SessionAuthGuard)
  posts(@CurrentAuth() _auth: AuthContext, @Body() dto: ListPostsDto) {
    return this.spike.listPosts(dto.accountId, dto.fields, dto.limit);
  }

  @Delete('spike/boxapi/accounts/:id')
  @UseGuards(SessionAuthGuard)
  deleteAccount(@CurrentAuth() _auth: AuthContext, @Param('id') id: string) {
    return this.spike.deleteAccount(id);
  }

  @Get('spike/boxapi/webhooks/captured')
  @UseGuards(SessionAuthGuard)
  captured(
    @CurrentAuth() _auth: AuthContext,
    @Query('limit') limit?: string,
  ) {
    return this.spike.listCaptures(limit ? Number(limit) : 50);
  }

  @Delete('spike/boxapi/webhooks/captured')
  @UseGuards(SessionAuthGuard)
  clearCaptured(@CurrentAuth() _auth: AuthContext) {
    return this.spike.clearCaptures();
  }

  @Get('spike/boxapi/oauth/callback')
  oauthCallback(@Query() query: Record<string, string>) {
    this.spike.assertEnabled();
    return {
      ok: true,
      recorded: this.spike.recordOauthCallback(query),
      next: 'Call GET /v1/spike/boxapi/accounts (authed) to see if page attached.',
    };
  }

  @Get('spike/boxapi/oauth/callbacks')
  @UseGuards(SessionAuthGuard)
  oauthCallbacks(@CurrentAuth() _auth: AuthContext) {
    return this.spike.listOauthCallbacks();
  }

  @Post('webhooks/instagram/boxapi/:webhookSecret')
  webhookPost(
    @Param('webhookSecret') webhookSecret: string,
    @Req()
    req: {
      method?: string;
      url?: string;
      headers: Record<string, string | string[] | undefined>;
    },
    @Body() body: unknown,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    this.spike.assertEnabled();
    this.spike.verifyWebhookSecret(webhookSecret);
    return this.spike.captureWebhook({
      method: 'POST',
      path: req.url ?? '/webhooks/instagram/boxapi',
      headers: { ...headers },
      payload: body,
    });
  }

  @Get('webhooks/instagram/boxapi/:webhookSecret')
  webhookGet(
    @Param('webhookSecret') webhookSecret: string,
    @Req()
    req: {
      url?: string;
      headers: Record<string, string | string[] | undefined>;
    },
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    this.spike.assertEnabled();
    this.spike.verifyWebhookSecret(webhookSecret);
    return this.spike.captureWebhook({
      method: 'GET',
      path: req.url ?? '/webhooks/instagram/boxapi',
      headers: { ...headers },
      payload: { query },
    });
  }
}
