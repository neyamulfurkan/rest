import type { Metadata } from 'next';
import { BookingPageClient } from './BookingPageClient';

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings`, { cache: 'force-cache', next: { revalidate: 3600 } });
    const { data: settings } = await response.json();
    
    const restaurantName = settings?.name || 'RestaurantOS';
    const description = settings?.description || 'Reserve your table online';
    const city = settings?.city || '';
    const state = settings?.state || '';
    const logoUrl = settings?.logoUrl;

    return {
      title: `Book a Table - ${restaurantName}${city ? ` | ${city}, ${state}` : ''}`,
       description: `Reserve your table at ${restaurantName}. Easy online booking for lunch, dinner, and special occasions${city ? ` in ${city}, ${state}` : ''}. Choose your preferred date, time, and party size. Instant confirmation!`,
      keywords: [
        restaurantName,
        'table reservation',
        'book a table',
        'restaurant booking',
        'reserve table',
        city,
        state,
        'online reservation',
        'table booking',
      ].filter(Boolean),
      alternates: {
        canonical: '/booking',
      },
      openGraph: {
        title: `Book a Table - ${restaurantName}`,
        description: description,
        type: 'website',
        url: `${baseUrl}/booking`,
        siteName: restaurantName,
        images: logoUrl ? [{
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: `Book a table at ${restaurantName}`,
        }] : [],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    console.error('Failed to generate booking metadata:', error);
    return {
      title: 'Book a Table - RestaurantOS',
      description: 'Reserve your table online',
    };
  }
}

export default async function BookingPage() {
  // Fetch settings server-side for SEO
  let settings: any = {};
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings`, { cache: 'force-cache', next: { revalidate: 3600 } });
    const { data } = await response.json();
    settings = data || {};
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }

  const restaurantName = settings?.name || 'RestaurantOS';
  const city = settings?.city || '';
  const state = settings?.state || '';

  // Generate ReserveAction JSON-LD
  const reservationSchema = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: restaurantName,
    acceptsReservations: 'True',
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL}/booking`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'Reservation',
        name: 'Table Reservation',
      },
    },
  };

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: process.env.NEXT_PUBLIC_APP_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Book a Table',
        item: `${process.env.NEXT_PUBLIC_APP_URL}/booking`,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data for Reservations */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reservationSchema),
        }}
      />
      
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <BookingPageClient restaurantName={restaurantName} city={city} state={state} />
    </>
  );
}