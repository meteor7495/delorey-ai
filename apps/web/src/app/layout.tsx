import type { ReactNode } from 'react';
import '@seloma/ui/colors.css';
import './globals.css';

export const metadata = {
  title: 'سِلوما — پلتفرم تجارت هوشمند | دستیار هوشمند برای فروشگاه آنلاین',
  applicationName: 'Seloma',
  description:
    'سِلوما پلتفرمی برای فروشگاه‌های آنلاین است که دستیارهای هوشمند تخصصی برای فروش، پشتیبانی، محصول و عملیات در اختیار شما می‌گذارد.',
  keywords: [
    'Seloma',
    'سِلوما',
    'دستیار هوشمند',
    'فروش هوشمند',
    'پشتیبانی مشتری',
    'خودکارسازی فروشگاه',
    'فروشگاه آنلاین',
    'تجارت هوشمند',
  ],
  openGraph: {
    title: 'سِلوما — پلتفرم تجارت هوشمند',
    siteName: 'Seloma',
    locale: 'fa_IR',
    type: 'website',
    description:
      'فروشگاه شما، یک تیم هوشمند دارد. سِلوما دستیارهای هوشمند را به محصولات، مشتریان و عملیات فروش شما وصل می‌کند.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سِلوما — پلتفرم تجارت هوشمند',
    description:
      'فروشگاه شما، یک تیم هوشمند دارد. دستیارهای هوشمند برای فروش، پشتیبانی و عملیات تجارت.',
  },
  alternates: {
    canonical: '/',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Seloma',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'پلتفرم تجارت هوشمند برای فروشگاه‌های آنلاین — دستیارهای هوشمند برای فروش، پشتیبانی، مشاوره محصول و خودکارسازی عملیات.',
  offers: {
    '@type': 'Offer',
    priceCurrency: 'IRR',
    availability: 'https://schema.org/InStock',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
