// src/components/customer/MenuItemCard.tsx

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Settings, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MenuItemWithRelations } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface MenuItemCardProps {
  item: MenuItemWithRelations;
  onAddToCart: (item: MenuItemWithRelations) => void;
  onItemClick: (item: MenuItemWithRelations) => void;
}

export default function MenuItemCard({
  item,
  onAddToCart,
  onItemClick,
}: MenuItemCardProps) {
  const hasCustomizations = item.customizationGroups && item.customizationGroups.length > 0;
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);

  useEffect(() => {
    // Fetch rating for this item
    fetch(`/api/menu/${item.id}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRating(data.data);
        }
      })
      .catch(() => {});
  }, [item.id]);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.isAvailable) {
      onAddToCart(item);
    }
  };

  const handleCardClick = () => {
    onItemClick(item);
  };

  return (
    <Card
      className="
        h-full
        flex
        flex-col
        overflow-hidden
        cursor-pointer
        transition-all
        duration-300
        hover:-translate-y-1
        sm:hover:-translate-y-2
        hover:shadow-xl
        border
      "
      style={{ 
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))'
      }}
      onClick={handleCardClick}
    >
      {/* Image Container - Fixed aspect ratio */}
      <div className="relative aspect-[4/3] w-full overflow-hidden shrink-0" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
        <Image
          src={item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16"%3ENo image%3C/text%3E%3C/svg%3E'}
          alt={`${item.name} - ${item.category?.name || 'Menu item'} at restaurant`}
          fill
          className="object-cover"
          loading="lazy"
          sizes="(max-width: 640px) 240px, (max-width: 768px) 280px, (max-width: 1024px) 300px, 320px"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (!target.src.startsWith('data:')) {
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="18"%3EImage unavailable%3C/text%3E%3C/svg%3E';
            }
          }}
        />

        {/* Vegetarian/Vegan Badge - Top Right Overlay */}
        {(item.isVegetarian || item.isVegan) && (
          <div className="absolute top-2 right-2">
            <Badge
              variant="success"
              className="bg-green-500 text-white shadow-md text-xs"
            >
              {item.isVegan ? 'Vegan' : 'Vegetarian'}
            </Badge>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-lg font-semibold">
              Out of Stock
            </span>
          </div>
        )}

        {/* Customization Icon - Bottom Right */}
        {hasCustomizations && item.isAvailable && (
          <div className="absolute bottom-2 right-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md">
              <Settings className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
        )}
      </div>

      {/* Content - Flex grow to fill remaining space */}
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        {/* Item Name - Fixed height */}
        <h3 className="text-base sm:text-lg font-bold mb-1 line-clamp-1 min-h-[1.5rem] sm:min-h-[1.75rem]" style={{ color: 'hsl(var(--foreground))' }}>
          {item.name}
        </h3>

        {/* Rating */}
        {rating && rating.count > 0 && (
          <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-xs sm:text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{rating.average.toFixed(1)}</span>
            <span className="text-[10px] sm:text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>({rating.count})</span>
          </div>
        )}

        {/* Description - Fixed 2 lines */}
        <div className="mb-2 sm:mb-3 min-h-[2.25rem] sm:min-h-[2.5rem]">
          {item.description && (
            <p className="text-xs sm:text-sm line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {item.description}
            </p>
          )}
        </div>

        {/* Additional Dietary Info Badges - Fixed height area */}
        <div className="mb-2 sm:mb-3 min-h-[1.25rem] sm:min-h-[1.5rem]">
          {item.isGlutenFree && (
            <Badge variant="outline" className="text-[10px] sm:text-xs">
              Gluten-Free
            </Badge>
          )}
        </div>

        {/* Price and Button - Push to bottom */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2">
          <span className="text-base sm:text-lg font-bold shrink-0" style={{ color: 'hsl(var(--primary))' }}>
            {formatCurrency(item.price)}
          </span>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className="
              transition-transform
              duration-200
              active:scale-95
              text-xs
              sm:text-sm
              shrink-0
              h-8
              sm:h-9
              px-3
              sm:px-4
              whitespace-nowrap
            "
            style={{
              backgroundColor: !item.isAvailable ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
              color: !item.isAvailable ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))',
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
}