import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decryptSecret, encryptSecret } from '../../platform/crypto.util';
import {
  maskCredentialHint,
  normalizePaymentGateway,
  normalizePaymentMode,
  type PaymentGatewayId,
  type PaymentMode,
  type PaymentProviderId,
} from '../domain/payment';
import { MockPaymentProvider } from './mock.payment-provider';
import type { IPaymentProvider } from './payment-provider';
import { ZarinpalPaymentProvider } from './zarinpal.payment-provider';

export type StorePaymentConfigRow = {
  tenantId: string;
  paymentMode?: string | null;
  paymentProvider?: string | null;
  zarinpalMerchantId?: string | null;
};

export type ResolvedPaymentProvider = {
  mode: PaymentMode;
  /** Store-configured gateway label (seloma | zarinpal). */
  gateway: PaymentGatewayId;
  /** Concrete adapter id persisted on Payment.provider. */
  providerId: PaymentProviderId;
  provider: IPaymentProvider;
  merchantId: string;
  callbackUrl: string;
};

/**
 * Single place that selects PLATFORM vs MERCHANT gateway credentials
 * and the concrete IPaymentProvider adapter. Checkout/Order must not
 * branch on provider themselves.
 */
@Injectable()
export class PaymentProviderResolver {
  private readonly log = new Logger(PaymentProviderResolver.name);

  constructor(
    private readonly config: ConfigService,
    private readonly mock: MockPaymentProvider,
    private readonly zarinpal: ZarinpalPaymentProvider,
  ) {}

  private publicBase() {
    return (
      this.config.get<string>('PUBLIC_API_BASE_URL') ??
      `http://localhost:${this.config.get('API_PORT') ?? 3001}`
    );
  }

  private credentialsSecret() {
    return (
      this.config.get<string>('JWT_SECRET') ??
      this.config.get<string>('CREDENTIALS_SECRET') ??
      'dev-secret-change-me'
    );
  }

  /** Platform (Seloma) merchant id from env — never from the store row. */
  platformMerchantId(): string {
    return (
      this.config.get<string>('SELOMA_ZARINPAL_MERCHANT_ID')?.trim() ||
      this.config.get<string>('ZARINPAL_MERCHANT_ID')?.trim() ||
      ''
    );
  }

  encryptMerchantCredential(plain: string): string {
    return encryptSecret(plain.trim(), this.credentialsSecret());
  }

  /**
   * Decrypt stored cipher; fall back to legacy plaintext for pre-encryption rows.
   * Never log the returned value.
   */
  decryptMerchantCredential(stored: string | null | undefined): string | null {
    const raw = stored?.trim();
    if (!raw) return null;
    try {
      const plain = decryptSecret(raw, this.credentialsSecret()).trim();
      return plain || null;
    } catch {
      return raw;
    }
  }

  credentialPublicView(stored: string | null | undefined): {
    hasMerchantCredentials: boolean;
    merchantCredentialHint: string | null;
  } {
    const plain = this.decryptMerchantCredential(stored);
    return {
      hasMerchantCredentials: Boolean(plain),
      merchantCredentialHint: maskCredentialHint(plain),
    };
  }

  resolve(settings: StorePaymentConfigRow): ResolvedPaymentProvider {
    const merchantPlain = this.decryptMerchantCredential(
      settings.zarinpalMerchantId,
    );
    const mode = normalizePaymentMode(
      settings.paymentMode,
      Boolean(merchantPlain),
    );
    const gateway = normalizePaymentGateway(mode, settings.paymentProvider);

    if (mode === 'merchant') {
      if (gateway !== 'zarinpal') {
        throw new BadRequestException(
          'درگاه انتخاب‌شده برای حالت پذیرنده پشتیبانی نمی‌شود',
        );
      }
      if (!merchantPlain) {
        throw new BadRequestException(
          'برای پرداخت با درگاه خودتان، کد پذیرنده را در تنظیمات پرداخت ذخیره کنید',
        );
      }
      return {
        mode,
        gateway,
        providerId: 'zarinpal',
        provider: this.zarinpal,
        merchantId: merchantPlain,
        callbackUrl: `${this.publicBase()}/v1/payments/zarinpal/callback`,
      };
    }

    // PLATFORM — Seloma gateway (env merchant → zarinpal, else mock)
    const platformMerchant = this.platformMerchantId();
    if (platformMerchant) {
      return {
        mode: 'platform',
        gateway: 'seloma',
        providerId: 'zarinpal',
        provider: this.zarinpal,
        merchantId: platformMerchant,
        callbackUrl: `${this.publicBase()}/v1/payments/zarinpal/callback`,
      };
    }

    this.log.debug(
      `Platform payment using mock provider for tenant=${settings.tenantId}`,
    );
    return {
      mode: 'platform',
      gateway: 'seloma',
      providerId: 'mock',
      provider: this.mock,
      merchantId: '',
      callbackUrl: `${this.publicBase()}/v1/payments/mock/callback`,
    };
  }

  /**
   * Lightweight connectivity check for merchant credentials.
   * Does not create a StorefrontOrder payment row.
   */
  async testConnection(settings: StorePaymentConfigRow): Promise<{
    ok: boolean;
    mode: PaymentMode;
    gateway: PaymentGatewayId;
    providerId: PaymentProviderId;
    message: string;
  }> {
    const resolved = this.resolve(settings);
    try {
      const result = await resolved.provider.request({
        orderId: `settings-test-${settings.tenantId}`,
        amount: 10_000,
        description: 'Seloma payment settings connection test',
        merchantId: resolved.merchantId,
        callbackUrl: resolved.callbackUrl,
      });
      if (!result.authority) {
        return {
          ok: false,
          mode: resolved.mode,
          gateway: resolved.gateway,
          providerId: resolved.providerId,
          message: 'پاسخ درگاه نامعتبر بود',
        };
      }
      return {
        ok: true,
        mode: resolved.mode,
        gateway: resolved.gateway,
        providerId: resolved.providerId,
        message:
          resolved.providerId === 'mock'
            ? 'اتصال آزمایشی (mock) برقرار است'
            : 'اتصال به درگاه تأیید شد',
      };
    } catch (err) {
      const safe =
        err instanceof BadRequestException
          ? String(err.message)
          : 'اتصال به درگاه برقرار نشد';
      this.log.warn(
        `payment settings test failed tenant=${settings.tenantId} provider=${resolved.providerId} mode=${resolved.mode}`,
      );
      return {
        ok: false,
        mode: resolved.mode,
        gateway: resolved.gateway,
        providerId: resolved.providerId,
        message: safe,
      };
    }
  }
}
