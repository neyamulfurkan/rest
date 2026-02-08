// src/app/(customer)/booking/layout.tsx

import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings`, {
      cache: 'force-cache',
      next: { revalidate: 3600 }
    });
    
    const { data: settings } = await response.json();
    const restaurantName = settings?.name || 'RestaurantOS';
    const city = settings?.city || '';
    
    return {
      title: `Book a Table - ${restaurantName}${city ? ` | ${city}` : ''}`,
      description: `Reserve your table at ${restaurantName}. Easy online booking for lunch, dinner, and special occasions.`,
      alternates: {
        canonical: '/booking',
      },
      openGraph: {
        title: `Book a Table - ${restaurantName}`,
        description: `Reserve your table online at ${restaurantName}`,
        type: 'website',
        url: `${baseUrl}/booking`,
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

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}