import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#3b82f6',
  };
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'POLODASH',
  description: 'Sistema profissional de gestão de tráfego pago e CRM com análise de ROI e métricas em tempo real',
  applicationName: 'POLODASH',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'POLODASH',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    siteName: 'POLODASH',
    title: 'POLODASH',
    description: 'Sistema profissional de gestão de tráfego pago e CRM',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POLODASH',
    description: 'Sistema profissional de gestão de tráfego pago e CRM',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-background text-foreground transition-colors duration-300`}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </Providers>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'} />
      </body>
    </html>
  );
}
