import type { Metadata } from 'next';
import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MenuItemCard from '@/components/customer/MenuItemCard';
import { MenuItemModal } from '@/components/customer/MenuItemModal';
import RecommendedItems from '@/components/customer/RecommendedItems';
import { useMenu } from '@/hooks/useMenu';
import { useCart } from '@/hooks/useCart';
import type { MenuItemWithRelations } from '@/types';

type SortOption = 'popular' | 'price-low-high' | 'price-high-low';

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
    
    // Fetch menu items
    const menuResponse = await fetch(`${baseUrl}/api/menu`, { cache: 'no-store' });
    const menuData = await menuResponse.json();
    initialMenuItems = menuData.data || [];
    
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

// Client Component for interactivity
'use client';

function MenuPageClient({ 
  restaurantName, 
  settings, 
  initialMenuItems, 
  initialCategories 
}: { 
  restaurantName: string; 
  settings: any; 
  initialMenuItems: any[]; 
  initialCategories: any[] 
}) {
  const { menuItems: clientMenuItems, categories: clientCategories, isLoading, error } = useMenu();
  // Use server-side data initially, then client-side data
  const menuItems = clientMenuItems || initialMenuItems;
  const categories = clientCategories || initialCategories;
  const { addItem } = useCart();
  const branding = settings?.branding || {};
  const restaurantId = settings?.id || 'rest123456789';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [selectedItem, setSelectedItem] = useState<MenuItemWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Debounced search (300ms delay)
  const [debouncedSearch, setDebouncedSearch] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle scroll for search bar transparency
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter and sort menu items
  const filteredAndSortedItems = useMemo(() => {
    if (!menuItems) return [];

    let filtered = menuItems;

    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.categoryId === selectedCategory);
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'price-low-high':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
      default:
        // Keep original order (assume sorted by popularity in DB)
        break;
    }

    return sorted;
  }, [menuItems, debouncedSearch, selectedCategory, sortBy]);

  // Handlers
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleItemClick = (item: MenuItemWithRelations) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddToCart = (item: MenuItemWithRelations) => {
    // If item has customizations, open modal instead
    if (item.customizationGroups && item.customizationGroups.length > 0) {
      handleItemClick(item);
      return;
    }

    // Add directly to cart if no customizations
    addItem(
      {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
      },
      1
    );
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-primary-500" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-red-500 text-lg mb-4">Failed to load menu items</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO: Hidden h1 for menu page */}
      <h1 className="sr-only">{restaurantName} - Full Menu - Order Online</h1>
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--page-bg))' }}>
      {/* Search & Filter Bar - Sticky - COMPACT */}
      <div 
        className={cn(
          'fixed top-16 md:top-20 left-0 right-0 z-30 border-b transition-all duration-500',
          branding.headerTransparentOverMedia
            ? 'backdrop-blur-md border-white/30 shadow-lg' 
            : isScrolled 
              ? 'backdrop-blur-md shadow-md border-neutral-200' 
              : 'backdrop-blur-md border-neutral-200'
        )}
        style={{ 
          backgroundColor: branding.headerTransparentOverMedia
            ? 'rgba(0, 0, 0, 0.45)' 
            : `${branding.headerBgColor}cc`,
          color: branding.headerTransparentOverMedia ? '#ffffff' : branding.headerTextColor,
        }}
      >
        <div className="container mx-auto px-3 py-2 md:py-3 max-w-7xl">
          {/* Mobile: Single row with search + sort */}
          <div className="flex md:hidden gap-2 mb-2">
            <div className="relative flex-1">
              <Search 
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" 
                style={{ color: branding.headerTransparentOverMedia ? 'rgba(255, 255, 255, 0.9)' : 'hsl(var(--muted-foreground))' }}
              />
              <Input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-8 h-9 text-sm border-2 transition-colors duration-200",
                  branding.headerTransparentOverMedia && "bg-white/20 border-white/40 text-white placeholder:text-white/80 focus:bg-white/30 focus:border-white/60"
                )}
                style={branding.headerTransparentOverMedia ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                } : {}}
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger 
                className={cn(
                  "w-[100px] h-9 text-sm border-2",
                  branding.headerTransparentOverMedia && "bg-white/20 border-white/40 text-white hover:bg-white/30"
                )}
                style={branding.headerTransparentOverMedia ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                } : {}}
              >
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="price-low-high">Low to High</SelectItem>
                <SelectItem value="price-high-low">High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Pills - Horizontal scroll */}
          <div className="flex md:hidden gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => handleCategoryClick('all')}
              size="sm"
              className={cn(
                "h-8 text-xs whitespace-nowrap shrink-0",
                branding.headerTransparentOverMedia && selectedCategory !== 'all' && "border-white/50 text-white hover:bg-white/20 bg-white/10"
              )}
            >
              All
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => handleCategoryClick(category.id)}
                size="sm"
                className={cn(
                  "h-8 text-xs whitespace-nowrap shrink-0",
                  branding.headerTransparentOverMedia && selectedCategory !== category.id && "border-white/50 text-white hover:bg-white/20 bg-white/10"
                )}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden md:flex gap-4 items-center">
            <div className="relative md:w-2/5">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" 
                style={{ color: branding.headerTransparentOverMedia ? 'rgba(255, 255, 255, 0.9)' : 'hsl(var(--muted-foreground))' }}
              />
              <Input
                type="text"
                placeholder="Search for dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 w-full border-2 transition-colors duration-200",
                  branding.headerTransparentOverMedia && "bg-white/20 border-white/40 text-white placeholder:text-white/80 focus:bg-white/30 focus:border-white/60"
                )}
                style={branding.headerTransparentOverMedia ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                } : {}}
              />
            </div>

            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-max md:min-w-0">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => handleCategoryClick('all')}
                  size="sm"
                  className={cn(
                    branding.headerTransparentOverMedia && selectedCategory !== 'all' && "border-white/50 text-white hover:bg-white/20 bg-white/10"
                  )}
                >
                  All
                </Button>
                {categories?.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    onClick={() => handleCategoryClick(category.id)}
                    size="sm"
                    className={cn(
                      branding.headerTransparentOverMedia && selectedCategory !== category.id && "border-white/50 text-white hover:bg-white/20 bg-white/10"
                    )}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="md:w-auto">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger 
                  className={cn(
                    "w-[200px] border-2",
                    branding.headerTransparentOverMedia && "bg-white/20 border-white/40 text-white hover:bg-white/30"
                  )}
                  style={branding.headerTransparentOverMedia ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    color: '#ffffff',
                  } : {}}
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Items */}
      <div className="pt-[90px] sm:pt-[95px] md:pt-[85px]">
        {restaurantId && (
          <RecommendedItems
            restaurantId={restaurantId}
            onItemClick={handleItemClick}
          />
        )}
      </div>

      {/* Menu Grid */}
      <div className="container mx-auto px-4 pb-8 max-w-7xl">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-500 text-lg">No items found</p>
            {(debouncedSearch || selectedCategory !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div
            className="
              grid
              grid-cols-2
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
              gap-3
              sm:gap-4
              md:gap-6
            "
          >
            {filteredAndSortedItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
                onItemClick={handleItemClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Menu Item Modal */}
        <MenuItemModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      </div>
    </>
  );
}