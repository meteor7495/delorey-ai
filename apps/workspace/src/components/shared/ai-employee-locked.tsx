'use client';

import Link from 'next/link';
import { Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000';

export function AiEmployeeLocked() {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-4 p-6 sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-2)]">
          <Bot size={24} className="text-[var(--brand-500)]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[var(--text-1)]">
            دستیار هوشمند در پلن شما فعال نیست
          </h2>
          <p className="max-w-md text-sm text-[var(--text-2)] leading-relaxed">
            فروشگاه‌ساز به‌تنهایی شامل ویترین، سفارش و کانال‌هاست. برای پاسخ
            خودکار به مشتریان، بستهٔ دستیار هوشمند را فعال کنید.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={`${WEB_URL}/request?plan=ai-sales`}>
              درخواست فعال‌سازی دستیار
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shop">بازگشت به فروشگاه</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
