import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { I18nProvider } from '@/i18n/i18nContext';
import dynamic from 'next/dynamic';
import { PageTransition } from '@/components/shared/PageTransition';

const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => ({ default: mod.Toaster })), {
  ssr: false,
});
import { SettingsLoader } from '@/components/shared/SettingsLoader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Fetch restaurant settings for dynamic metadata
    const response = await fetch(`${baseUrl}/api/settings`, {
      cache: 'no-store',
    });
    
    const { data: settings } = await response.json();
    const restaurantName = settings?.name || 'RestaurantOS';
    const description = settings?.description || 'A comprehensive, self-hosted restaurant management platform with QR ordering, table booking, admin dashboard, and AI-powered features.';
    const logoUrl = settings?.logoUrl;
    const city = settings?.city || '';
    const state = settings?.state || '';
    // Address, phone, email used in structured data below
    
    return {
      title: {
        default: `${restaurantName} - Order Online & Book Tables${city ? ` in ${city}` : ''}`,
        template: `%s | ${restaurantName}`,
      },
      description: description,
      keywords: [
        restaurantName,
        'restaurant',
        'food delivery',
        'online ordering',
        'table booking',
        'menu',
        city,
        state,
        'dine in',
        'takeout',
        'pickup',
        'QR ordering',
      ].filter(Boolean),
      authors: [{ name: restaurantName }],
      creator: restaurantName,
      publisher: restaurantName,
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      metadataBase: new URL(baseUrl),
      alternates: {
        canonical: '/',
      },
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: baseUrl,
        title: `${restaurantName} - Order Online & Book Tables`,
        description: description,
        siteName: restaurantName,
        images: logoUrl ? [
          {
            url: logoUrl,
            width: 1200,
            height: 630,
            alt: `${restaurantName} logo`,
          },
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${restaurantName} - Order Online`,
        description: description,
        images: logoUrl ? [logoUrl] : [],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/apple-touch-icon.png',
      },
      manifest: '/manifest.json',
      other: {
        'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    // Fallback metadata
    return {
      title: 'RestaurantOS - Modern Restaurant Management Platform',
      description: 'Order food online and book tables',
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch restaurant data for structured data
  let restaurantData: any = {};
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings`, {
      cache: 'no-store',
    });
    const { data } = await response.json();
    restaurantData = data;
  } catch (error) {
    console.error('Failed to fetch restaurant data for SEO:', error);
  }

  // Generate JSON-LD structured data for Google
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurantData?.name || 'RestaurantOS',
    description: restaurantData?.description || 'Online food ordering and table reservations',
    image: restaurantData?.logoUrl || '',
    url: process.env.NEXT_PUBLIC_APP_URL,
    telephone: restaurantData?.phone || '',
    email: restaurantData?.email || '',
    address: restaurantData?.address ? {
      '@type': 'PostalAddress',
      streetAddress: restaurantData.address,
      addressLocality: restaurantData.city || '',
      addressRegion: restaurantData.state || '',
      postalCode: restaurantData.zipCode || '',
      addressCountry: restaurantData.country || 'US',
    } : undefined,
    geo: restaurantData?.latitude && restaurantData?.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: restaurantData.latitude,
      longitude: restaurantData.longitude,
    } : undefined,
    priceRange: '$$',
    servesCuisine: 'Multiple cuisines',
    acceptsReservations: true,
    hasMenu: `${process.env.NEXT_PUBLIC_APP_URL}/menu`,
    paymentAccepted: 'Cash, Credit Card, Debit Card',
    currenciesAccepted: 'USD',
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* JSON-LD Structured Data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('restaurant-settings');
                  if (stored) {
                    const settings = JSON.parse(stored);
                    const hexToHsl = (hex) => {
                      const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
                      if (!result) return '0 0% 0%';
                      const r = parseInt(result[1], 16) / 255;
                      const g = parseInt(result[2], 16) / 255;
                      const b = parseInt(result[3], 16) / 255;
                      const max = Math.max(r, g, b);
                      const min = Math.min(r, g, b);
                      let h = 0, s = 0, l = (max + min) / 2;
                      if (max !== min) {
                        const d = max - min;
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                        switch (max) {
                          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                          case g: h = ((b - r) / d + 2) / 6; break;
                          case b: h = ((r - g) / d + 4) / 6; break;
                        }
                      }
                      h = Math.round(h * 360);
                      s = Math.round(s * 100);
                      l = Math.round(l * 100);
                      return h + ' ' + s + '% ' + l + '%';
                    };
                    if (settings.branding) {
                      const b = settings.branding;
                      const root = document.documentElement;
                      if (b.primaryColor) root.style.setProperty('--primary', hexToHsl(b.primaryColor));
                      if (b.secondaryColor) root.style.setProperty('--secondary', hexToHsl(b.secondaryColor));
                      if (b.accentColor) root.style.setProperty('--accent', hexToHsl(b.accentColor));
                      if (b.pageBgColor) root.style.setProperty('--page-bg', hexToHsl(b.pageBgColor));
                      if (b.bodyColor) {
                        root.style.setProperty('--background', hexToHsl(b.bodyColor));
                        root.style.setProperty('--card', hexToHsl(b.bodyColor));
                      }
                      if (b.bodyTextColor) {
                        root.style.setProperty('--foreground', hexToHsl(b.bodyTextColor));
                        root.style.setProperty('--card-foreground', hexToHsl(b.bodyTextColor));
                        root.style.setProperty('--popover-foreground', hexToHsl(b.bodyTextColor));
                        root.style.setProperty('--muted-foreground', hexToHsl(b.bodyTextColor));
                      }
                      if (b.headerBgColor) root.style.setProperty('--header-bg', hexToHsl(b.headerBgColor));
                      if (b.headerTextColor) root.style.setProperty('--header-text', hexToHsl(b.headerTextColor));
                      if (b.footerBgColor) root.style.setProperty('--footer-bg', hexToHsl(b.footerBgColor));
                      if (b.footerTextColor) root.style.setProperty('--footer-text', hexToHsl(b.footerTextColor));
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} overflow-x-hidden`} suppressHydrationWarning>
        <Providers>
          <I18nProvider>
            <SettingsLoader />
            <PageTransition>
              {children}
            </PageTransition>
          </I18nProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}