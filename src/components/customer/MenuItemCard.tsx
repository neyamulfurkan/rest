// src/components/customer/MenuItemCard.tsx

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Star, Sparkles, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MenuItemWithRelations } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
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

  const getDietaryBadges = () => {
    const badges = [];
    if (item.isVegan) badges.push({ label: '🌱 Vegan', color: 'success' });
    else if (item.isVegetarian) badges.push({ label: '🥬 Vegetarian', color: 'success' });
    if (item.isGlutenFree) badges.push({ label: '🌾 GF', color: 'secondary' });
    return badges;
  };

  const dietaryBadges = getDietaryBadges();

  return (
    <Card
      className={cn(
        "group relative h-full flex flex-col overflow-hidden cursor-pointer",
        "transition-all duration-500 ease-out",
        "hover:shadow-2xl",
        "border-0 rounded-2xl sm:rounded-3xl",
        !item.isAvailable && "opacity-75",
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ 
        backgroundColor: 'hsl(var(--card))',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={(node) => {
        if (!node) return;
        const observer = new IntersectionObserver(
          ([entry]) => setIsInView(entry.isIntersecting),
          { threshold: 0.1, rootMargin: '-50px' }
        );
        observer.observe(node);
        return () => observer.disconnect();
      }}
    >
      {/* Image Section with Gradient Overlay */}
      <div className="relative aspect-[4/3] w-full overflow-hidden shrink-0">
        {/* Main Image */}
        <div className="relative w-full h-full">
          <Image
            src={item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23f3f4f6;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23e5e7eb;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23grad)" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14" font-weight="500"%3ENo Image%3C/text%3E%3C/svg%3E'}
            alt={`${item.name} - ${item.category?.name || 'Menu item'}`}
            fill
            className={cn(
              "object-cover transition-all duration-500",
              "group-hover:scale-110",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 25vw"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (!target.src.startsWith('data:')) {
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EImage Error%3C/text%3E%3C/svg%3E';
              }
              setImageLoaded(true);
            }}
          />
          
          {/* Subtle bottom gradient overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>

        {/* Top Badges - Dietary Info */}
        {dietaryBadges.length > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1.5">
            {dietaryBadges.map((badge, index) => (
              <div
                key={index}
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-md shadow-lg"
                style={{
                  backgroundColor: 'hsla(var(--card), 0.95)',
                  color: 'hsl(var(--primary))',
                  border: '1px solid hsla(var(--primary), 0.2)'
                }}
              >
                {badge.label}
              </div>
            ))}
          </div>
        )}

        {/* Rating Badge - Top Right */}
        {rating && rating.count > 0 && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <div
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full backdrop-blur-md shadow-lg"
              style={{
                backgroundColor: 'hsla(var(--card), 0.95)',
              }}
            >
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-[11px] sm:text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                {rating.average.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Customization Indicator - Bottom Right */}
        {hasCustomizations && item.isAvailable && (
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
            <div
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full backdrop-blur-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                backgroundColor: 'hsla(var(--primary), 0.95)',
                color: 'hsl(var(--primary-foreground))',
              }}
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-xs font-semibold">Customizable</span>
            </div>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <span className="text-white text-base sm:text-lg font-bold">Out of Stock</span>
            <span className="text-white/80 text-xs sm:text-sm">Check back soon</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 lg:p-5">
        {/* Title & Description */}
        <div className="flex-1 mb-3 sm:mb-4">
          <h3 
            className="text-base sm:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2 line-clamp-1 transition-colors"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {item.name}
          </h3>
          
          {item.description && (
            <p 
              className="text-xs sm:text-sm leading-relaxed line-clamp-2 transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {item.description}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between gap-3 mt-auto">
          {/* Price */}
          <div className="flex flex-col">
            <span 
              className="text-xl sm:text-2xl lg:text-3xl font-bold leading-none"
              style={{ color: 'hsl(var(--primary))' }}
            >
              {formatCurrency(item.price)}
            </span>
            {rating && rating.count > 0 && (
              <span 
                className="text-[10px] sm:text-xs mt-0.5"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className={cn(
              "relative overflow-hidden",
              "transition-all duration-300",
              "active:scale-95",
              "font-semibold",
              "shadow-lg hover:shadow-xl",
              "rounded-xl sm:rounded-2xl",
              "h-9 sm:h-10 lg:h-11",
              "px-3 sm:px-4 lg:px-5",
              "text-xs sm:text-sm lg:text-base",
              "group/btn"
            )}
            style={{
              backgroundColor: !item.isAvailable 
                ? 'hsl(var(--muted))' 
                : 'hsl(var(--primary))',
              color: !item.isAvailable 
                ? 'hsl(var(--muted-foreground))' 
                : 'hsl(var(--primary-foreground))',
            }}
          >
            {/* Button Content */}
            <span className="flex items-center gap-1.5 sm:gap-2 relative z-10">
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover/btn:scale-110" />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="inline sm:hidden">Add</span>
            </span>

            {/* Hover Effect Overlay */}
            <div 
              className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"
            />
          </Button>
        </div>
      </div>

      {/* Shimmer Loading Effect */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      )}
    </Card>
  );
}