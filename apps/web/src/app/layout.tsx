import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'DeloRey — کارمند فروش هوش مصنوعی',
  description:
    'پلتفرم SaaS فروش و پشتیبانی هوشمند برای فروشگاه‌های آنلاین ایران',
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
