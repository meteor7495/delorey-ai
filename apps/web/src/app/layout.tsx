import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'سِلوما — سایت‌ساز و فروش یکپارچه',
  applicationName: 'Seloma',
  description:
    'سِلوما یک پلتفرم هوش مصنوعی برای کسب‌وکارهاست که با ارائه کارمندهای هوشمند، فروش، پشتیبانی، بازاریابی و ارتباط با مشتری را خودکار می‌کند.',
  openGraph: {
    title: 'سِلوما — سایت‌ساز و فروش یکپارچه',
    siteName: 'Seloma',
    locale: 'fa_IR',
    description:
      'سِلوما یک پلتفرم هوش مصنوعی برای کسب‌وکارهاست که با ارائه کارمندهای هوشمند، فروش، پشتیبانی، بازاریابی و ارتباط با مشتری را خودکار می‌کند.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سِلوما — سایت‌ساز و فروش یکپارچه',
    description:
      'سِلوما یک پلتفرم هوش مصنوعی برای کسب‌وکارهاست که با ارائه کارمندهای هوشمند، فروش، پشتیبانی، بازاریابی و ارتباط با مشتری را خودکار می‌کند.',
  },
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
