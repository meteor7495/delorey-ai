import {
  BadRequestException,
  Controller,
  Headers,
  Param,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { DataStore } from '../platform/data.store';
import { ShopifyAdapterService } from '../adapters/shopify/shopify.service';
import { WooCommerceAdapterService } from '../adapters/woocommerce/woocommerce.service';

/**
 * Unified store webhook ingress — routes by StoreConnection.platform.
 * HMAC verified inside each adapter; HTTP must ack fast (work on batch.sync).
 */
@Controller()
export class StoreWebhookController {
  constructor(
    private readonly store: DataStore,
    private readonly shopify: ShopifyAdapterService,
    private readonly woo: WooCommerceAdapterService,
  ) {}

  @Post('webhooks/store/:connectionId')
  async webhook(
    @Param('connectionId') connectionId: string,
    @Headers('x-shopify-topic') shopifyTopic: string | undefined,
    @Headers('x-shopify-hmac-sha256') shopifyHmac: string | undefined,
    @Headers('x-shopify-webhook-id') shopifyWebhookId: string | undefined,
    @Headers('x-shopify-shop-domain') shopifyShopDomain: string | undefined,
    @Headers('x-wc-webhook-topic') wooTopic: string | undefined,
    @Headers('x-wc-webhook-signature') wooSignature: string | undefined,
    @Headers('x-wc-webhook-id') wooWebhookId: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('بدنه خام webhook در دسترس نیست.');
    }
    const connection = await this.store.getStoreById(connectionId);
    if (!connection) {
      throw new BadRequestException('اتصال فروشگاه یافت نشد.');
    }
    if (connection.platform === 'woocommerce') {
      return this.woo.handleWebhook({
        connectionId,
        topic: wooTopic,
        signature: wooSignature,
        webhookId: wooWebhookId,
        rawBody,
      });
    }
    return this.shopify.handleWebhook({
      connectionId,
      topic: shopifyTopic,
      hmac: shopifyHmac,
      webhookId: shopifyWebhookId,
      shopDomain: shopifyShopDomain,
      rawBody,
    });
  }
}
