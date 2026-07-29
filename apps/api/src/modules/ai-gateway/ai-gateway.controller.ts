import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { AuditService } from '../audit/audit.service';
import { GatewayOpsService } from './application/gateway-ops.service';
import { PROVIDER_PRESETS } from './infrastructure/provider-presets';

const PROVIDER_IDS = [
  'mock',
  ...Object.keys(PROVIDER_PRESETS),
] as const;

class PreferredModelsDto {
  @IsOptional()
  @IsString()
  cheap?: string;

  @IsOptional()
  @IsString()
  premium?: string;

  @IsOptional()
  @IsString()
  embed?: string;
}

class UpsertAiPolicyDto {
  @IsOptional()
  @IsString()
  preferredProvider?: string | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PreferredModelsDto)
  preferredModels?: PreferredModelsDto | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedProviders?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedProviders?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fallbackOrder?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  maxCostPerTurnUsd?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100_000)
  maxCostPerDayUsd?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(120_000)
  latencyTargetMs?: number | null;

  @IsOptional()
  @IsIn(['standard', 'high'])
  qualityTarget?: 'standard' | 'high';
}

/**
 * Ops surfaces for AI Gateway / Provider Layer.
 * Not a merchant model playground — cost/reliability policy only.
 */
@Controller('ai-gateway')
@UseGuards(SessionAuthGuard)
export class AiGatewayController {
  constructor(
    private readonly ops: GatewayOpsService,
    private readonly audit: AuditService,
  ) {}

  @Get('health')
  health() {
    return this.ops.health();
  }

  @Get('policy')
  async getPolicy(@CurrentAuth() auth: AuthContext) {
    const policy = await this.ops.getPolicy(auth.tenantId);
    return {
      policy,
      defaults: {
        mode: 'env AI_GATEWAY_*',
        note: 'Null policy means env primary + fallbacks only.',
      },
    };
  }

  @Put('policy')
  async putPolicy(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: UpsertAiPolicyDto,
  ) {
    this.assertProviders(dto);
    const policy = await this.ops.upsertPolicy(auth.tenantId, {
      preferredProvider: dto.preferredProvider,
      preferredModels: dto.preferredModels ?? undefined,
      allowedProviders: dto.allowedProviders,
      blockedProviders: dto.blockedProviders,
      fallbackOrder: dto.fallbackOrder,
      maxCostPerTurnUsd: dto.maxCostPerTurnUsd,
      maxCostPerDayUsd: dto.maxCostPerDayUsd,
      latencyTargetMs: dto.latencyTargetMs,
      qualityTarget: dto.qualityTarget,
    });
    await this.audit.recordAdmin(
      auth,
      'ai_gateway.policy',
      'به‌روزرسانی سیاست AI Gateway',
      {
        preferredProvider: policy.preferredProvider,
        maxCostPerDayUsd: policy.maxCostPerDayUsd,
        fallbackOrder: policy.fallbackOrder,
      },
    );
    return { policy };
  }

  @Get('usage')
  usage(@CurrentAuth() auth: AuthContext) {
    return this.ops.usage(auth.tenantId);
  }

  private assertProviders(dto: UpsertAiPolicyDto) {
    const known = new Set<string>(PROVIDER_IDS);
    const check = (ids: string[] | undefined, field: string) => {
      if (!ids) return;
      for (const id of ids) {
        if (!known.has(id)) {
          throw new BadRequestException(`Unknown provider in ${field}: ${id}`);
        }
      }
    };
    if (
      dto.preferredProvider != null &&
      dto.preferredProvider !== '' &&
      !known.has(dto.preferredProvider)
    ) {
      throw new BadRequestException(
        `Unknown preferredProvider: ${dto.preferredProvider}`,
      );
    }
    check(dto.allowedProviders, 'allowedProviders');
    check(dto.blockedProviders, 'blockedProviders');
    check(dto.fallbackOrder, 'fallbackOrder');
  }
}
