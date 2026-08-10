import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'DeloRey — سایت‌ساز و فروش یکپارچه',
  description:
    'ویترین بومی، سفارش از وب و پیام‌رسان‌ها در یک Workspace — کارمند فروش AI اختیاری',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
