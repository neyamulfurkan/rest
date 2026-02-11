import type { Metadata } from 'next';
import { MenuPageClient } from './MenuPageClient';

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings`, { cache: 'force-cache', next: { revalidate: 3600 } });
    const { data: settings } = await response.json();
    
    const restaurantName = settings?.name || 'RestaurantOS';
    const description = settings?.description || 'Browse our delicious menu';
    const city = settings?.city || '';
    const state = settings?.state || '';
    const logoUrl = settings?.logoUrl;

    return {
      title: `Menu - ${restaurantName}${city ? ` | ${city}, ${state}` : ''}`,
      description: `Explore our full menu at ${restaurantName}. Order online for delivery, pickup, or dine-in${city ? ` in ${city}, ${state}` : ''}.`,
      keywords: [
        restaurantName,
        'menu',
        'food menu',
        'restaurant menu',
        'order online',
        city,
        state,
        'delivery menu',
        'takeout menu',
        'dine-in menu',
        `${city} restaurants`,
        `food delivery ${city}`,
        'online food ordering',
      ].filter(Boolean),
      alternates: {
        canonical: '/menu',
      },
      openGraph: {
        title: `Menu - ${restaurantName}`,
        description: description,
        type: 'website',
        url: `${baseUrl}/menu`,
        siteName: restaurantName,
        images: logoUrl ? [{
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: `${restaurantName} menu`,
        }] : [],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    console.error('Failed to generate menu metadata:', error);
    return {
      title: 'Menu - RestaurantOS',
      description: 'Browse our delicious menu',
    };
  }
}

export default async function MenuPage() {
  // Fetch settings and menu items server-side for SEO
  let settings: any = {};
  let initialMenuItems: any[] = [];
  let initialCategories: any[] = [];
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Fetch settings
    const settingsResponse = await fetch(`${baseUrl}/api/settings`, { cache: 'force-cache', next: { revalidate: 3600 } });
    const settingsData = await settingsResponse.json();
    settings = settingsData.data || {};
    
    // Fetch menu items - limit to 30 for faster initial load
    const menuResponse = await fetch(`${baseUrl}/api/menu?limit=30`, { 
      cache: 'force-cache',
      next: { revalidate: 600 }, // 10 minute cache
    });
    if (menuResponse.ok) {
      const menuData = await menuResponse.json();
      initialMenuItems = menuData.data || [];
    }
    
    // Fetch categories
    const categoriesResponse = await fetch(`${baseUrl}/api/menu/categories`, { cache: 'force-cache', next: { revalidate: 3600 } });
    const categoriesData = await categoriesResponse.json();
    initialCategories = categoriesData.data || [];
  } catch (error) {
    console.error('Failed to fetch menu data:', error);
  }

  const restaurantName = settings?.name || 'RestaurantOS';

  // Generate MenuSection JSON-LD
  const menuSectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'MenuSection',
    name: `${restaurantName} Menu`,
    hasMenuItem: initialMenuItems.slice(0, 10).map((item: any) => ({
      '@type': 'MenuItem',
      name: item.name,
      description: item.description || '',
      offers: {
        '@type': 'Offer',
        price: item.price,
        priceCurrency: 'USD',
        availability: item.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
      image: item.imageUrl || '',
      suitableForDiet: [
        ...(item.isVegetarian ? ['https://schema.org/VegetarianDiet'] : []),
        ...(item.isVegan ? ['https://schema.org/VeganDiet'] : []),
        ...(item.isGlutenFree ? ['https://schema.org/GlutenFreeDiet'] : []),
      ],
    })),
  };

  // Breadcrumb schema for SEO
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
        name: 'Menu',
        item: `${process.env.NEXT_PUBLIC_APP_URL}/menu`,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data for Menu */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(menuSectionSchema),
        }}
      />
      
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <MenuPageClient 
        restaurantName={restaurantName}
        settings={settings}
        initialMenuItems={initialMenuItems}
        initialCategories={initialCategories}
      />
    </>
  );
}