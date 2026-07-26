import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'DeloRey — فضای کاری',
  description: 'کنترل‌پنل کارمند فروش هوش مصنوعی',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
