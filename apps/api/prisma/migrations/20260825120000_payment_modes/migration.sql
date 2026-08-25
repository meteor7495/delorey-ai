-- Multi-provider payment modes: platform vs merchant gateway ownership

ALTER TABLE "payments" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'platform';

ALTER TABLE "storefront_settings" ADD COLUMN "payment_mode" TEXT NOT NULL DEFAULT 'platform';
ALTER TABLE "storefront_settings" ADD COLUMN "payment_provider" TEXT NOT NULL DEFAULT 'seloma';

-- Legacy: stores that already configured a ZarinPal merchant id were using merchant credentials
UPDATE "storefront_settings"
SET
  "payment_mode" = 'merchant',
  "payment_provider" = 'zarinpal'
WHERE "zarinpal_merchant_id" IS NOT NULL
  AND TRIM("zarinpal_merchant_id") <> '';
