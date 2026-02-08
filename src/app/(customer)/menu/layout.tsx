// src/app/(customer)/menu/layout.tsx

import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings`, {
      cache: 'no-store',
    });
    
    const { data: settings } = await response.json();
    const restaurantName = settings?.name || 'RestaurantOS';
    const city = settings?.city || '';
    
    return {
      title: `Menu - ${restaurantName}${city ? ` | ${city}` : ''}`,
      description: `Browse our full menu and order your favorite dishes online. Fast delivery and pickup available at ${restaurantName}.`,
      alternates: {
        canonical: '/menu',
      },
      openGraph: {
        title: `Menu - ${restaurantName}`,
        description: `Browse our delicious menu and order online`,
        type: 'website',
        url: `${baseUrl}/menu`,
      },
    };
  } catch (error) {
    console.error('Failed to generate menu metadata:', error);
    return {
      title: 'Menu - RestaurantOS',
      description: 'Browse our menu and order online',
    };
  }
}

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}