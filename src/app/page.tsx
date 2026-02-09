import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';

// CRITICAL: Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings`, { 
      cache: 'no-store' // Metadata can be cached by Next.js itself
    });
    const { data: settings } = await response.json();
    
    const restaurantName = settings?.name || 'RestaurantOS';
    const description = settings?.description || 'Experience culinary excellence delivered to your doorstep';
    const city = settings?.city || '';
    const state = settings?.state || '';
    const logoUrl = settings?.logoUrl;

    return {
      title: `${restaurantName} - Order Food Online & Book Tables${city ? ` in ${city}, ${state}` : ''}`,
      description: description.length >= 120 && description.length <= 160 ? description : `${description.substring(0, 140)} Order delivery, pickup, or dine-in at ${restaurantName}${city ? ` in ${city}, ${state}` : ''}`,
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
        'food near me',
        'restaurant near me',
        `best restaurant in ${city}`,
        'order food online',
      ].filter(Boolean),
      alternates: {
        canonical: '/',
      },
      openGraph: {
        title: `${restaurantName} - Order Food Online${city ? ` in ${city}` : ''}`,
        description: description,
        type: 'website',
        url: baseUrl,
        siteName: restaurantName,
        images: logoUrl ? [{
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: `${restaurantName} - Best restaurant${city ? ` in ${city}` : ''}`,
        }] : [],
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${restaurantName} - Order Food Online`,
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
      ...(settings?.latitude && settings?.longitude && city && state ? {
        other: {
          'geo.position': `${settings.latitude};${settings.longitude}`,
          'geo.placename': city,
          'geo.region': `US-${state}`,
          'ICBM': `${settings.latitude}, ${settings.longitude}`,
        },
      } : {}),
    };
  } catch (error) {
    console.error('Failed to generate homepage metadata:', error);
    return {
      title: 'RestaurantOS - Order Food Online',
      description: 'Experience culinary excellence delivered to your doorstep',
    };
  }
}

export default function HomePage() {
  // NO server-side fetch - let client handle it to avoid Vercel build errors
  // The client component will fetch settings on mount
  const settings = null;
  const restaurantName = 'RestaurantOS';
  const content = null;
  
  // Generate JSON-LD structured data for Google (minimal version, client will enhance)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'RestaurantOS',
    description: 'Experience culinary excellence',
    url: process.env.NEXT_PUBLIC_APP_URL,
    priceRange: '$$',
    servesCuisine: 'Multiple cuisines',
    acceptsReservations: true,
    hasMenu: `${process.env.NEXT_PUBLIC_APP_URL}/menu`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '250',
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--page-bg))' }}>
        <HomePageClient 
          restaurantName={restaurantName}
          settings={settings}
          content={content}
        />
      </div>
    </>
  );
}