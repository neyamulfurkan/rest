// src/app/(customer)/layout.tsx

import type { Metadata } from 'next';
import CustomerLayoutWrapper from '@/components/layouts/CustomerLayoutWrapper';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings`, {
      cache: 'force-cache',
      next: { revalidate: 3600 }
    });
    
    const { data: settings } = await response.json();
    const restaurantName = settings?.name || 'RestaurantOS';
    const description = settings?.description || 'Experience culinary excellence. Order online or book a table.';
    const city = settings?.city || '';
    const logoUrl = settings?.logoUrl;
    
    return {
      title: `${restaurantName}${city ? ` - ${city}` : ''}`,
      description: description,
      alternates: {
        canonical: '/',
      },
      openGraph: {
        title: `${restaurantName}`,
        description: description,
        type: 'website',
        images: logoUrl ? [{ url: logoUrl }] : [],
      },
    };
  } catch (error) {
    console.error('Failed to generate customer layout metadata:', error);
    return {
      title: 'RestaurantOS',
      description: 'Order food online and book tables',
    };
  }
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerLayoutWrapper>{children}</CustomerLayoutWrapper>;
}