import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '儿童安全座椅设计助手_PWA_V7.5.0_免费智能体版',
    template: '%s | 儿童安全座椅设计助手',
  },
  description:
    '专业的儿童安全座椅尺寸计算与伤害指标分析工具，支持云端智能体和本地计算两种模式，提供免费的智能体服务。',
  keywords: [
    '儿童安全座椅',
    '安全座椅尺寸',
    '伤害指标',
    'HIC',
    '3ms加速度',
    '安全设计',
    '智能体',
    'PWA',
    '移动应用',
  ],
  authors: [{ name: '儿童安全座椅设计团队' }],
  generator: 'Next.js PWA',
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#667eea' },
    { media: '(prefers-color-scheme: dark)', color: '#764ba2' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '座椅助手',
  },
  openGraph: {
    title: '儿童安全座椅设计助手 | 专业PWA应用',
    description: '专业的儿童安全座椅尺寸计算与伤害指标分析工具',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon-192.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(error => {
                      console.log('ServiceWorker registration failed: ', error);
                    });
                });
              }
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
