import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import '@seloma/ui/colors.css';
import './globals.css';

export const metadata = {
  title: 'سِلوما — فضای کاری',
  applicationName: 'Seloma',
  description: 'کنترل‌پنل کارمند فروش هوش مصنوعی سِلوما',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
