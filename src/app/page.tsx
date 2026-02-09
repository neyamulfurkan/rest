import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings`, { cache: 'force-cache', next: { revalidate: 3600 } });
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

export default async function HomePage() {
  // Fetch settings server-side for SEO
  let settings: any = {};
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings`, { 
      cache: 'force-cache'
    });
    
    if (!response.ok) {
      throw new Error(`Settings API failed: ${response.status}`);
    }
    
    const { data } = await response.json();
    settings = data || {};
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    // Use defaults on error
    settings = {
      name: 'RestaurantOS',
      description: 'Experience culinary excellence',
      city: '',
      state: '',
    };
  }

  const restaurantName = settings?.name || 'RestaurantOS';
  const city = settings?.city || '';
  const state = settings?.state || '';
  const content = {
    story: settings?.aboutStory || undefined,
    mission: settings?.aboutMission || undefined,
    values: settings?.aboutValues || undefined,
  };
  // Generate JSON-LD structured data for Google
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurantName,
    description: settings?.description || 'Experience culinary excellence',
    image: settings?.logoUrl || '',
    url: process.env.NEXT_PUBLIC_APP_URL,
    telephone: settings?.phone || '',
    email: settings?.email || '',
    address: settings?.address ? {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressLocality: city,
      addressRegion: state,
      postalCode: settings.zipCode || '',
      addressCountry: settings.country || 'US',
    } : undefined,
    geo: settings?.latitude && settings?.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: settings.latitude,
      longitude: settings.longitude,
    } : undefined,
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