// src/components/customer/MenuItemModal.tsx

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Minus, Plus, X, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/hooks/useCart';
import type { MenuItemWithRelations } from '@/types';
import { cn } from '@/lib/utils';

interface MenuItemModalProps {
  item: MenuItemWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ReviewData {
  average: number;
  count: number;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    customer: {
      name: string;
    };
  }>;
}

export function MenuItemModal({ item, isOpen, onClose }: MenuItemModalProps) {
  const { addItem } = useCart();
  
  // State for quantity and customizations
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [reviewsData, setReviewsData] = useState<ReviewData | null>(null);

  // Fetch reviews when modal opens
  useEffect(() => {
    if (isOpen && item) {
      fetch(`/api/menu/${item.id}/reviews`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setReviewsData(data.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, item]);

  // Reset state when modal opens with new item
  useEffect(() => {
    if (isOpen && item) {
      setQuantity(1);
      setSelectedOptions({});
      setSpecialInstructions('');
    }
  }, [isOpen, item]);

  if (!item) return null;

  // Calculate total price based on item price + customization modifiers
  const calculateTotal = (): number => {
    let total = item.price;

    // Add customization prices
    item.customizationGroups?.forEach((group) => {
      const selected = selectedOptions[group.id] || [];
      selected.forEach((optionId) => {
        const option = group.options.find((opt) => opt.id === optionId);
        if (option) {
          total += option.priceModifier;
        }
      });
    });

    return total * quantity;
  };

  // Handle customization option selection
  const handleOptionChange = (groupId: string, optionId: string, type: string) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];

      if (type === 'RADIO') {
        return { ...prev, [groupId]: [optionId] };
      } else {
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
        } else {
          return { ...prev, [groupId]: [...current, optionId] };
        }
      }
    });
  };

  // Handle quantity change
  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    const customizations: { groupName: string; optionName: string; price: number }[] = [];

    item.customizationGroups?.forEach((group) => {
      const selected = selectedOptions[group.id] || [];
      selected.forEach((optionId) => {
        const option = group.options.find((opt) => opt.id === optionId);
        if (option) {
          customizations.push({
            groupName: group.name,
            optionName: option.name,
            price: option.priceModifier,
          });
        }
      });
    });

    addItem(
      {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
      },
      quantity,
      customizations.length > 0 ? customizations : undefined,
      specialInstructions || undefined
    );

    onClose();
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0 w-[calc(100vw-1rem)] sm:w-full gap-0"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        {/* Close Button - Fixed position */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-50">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-lg hover:shadow-xl transition-all"
            style={{ 
              backgroundColor: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))'
            }}
            aria-label="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
        
        {/* Hero Image */}
        <div 
          className="relative h-[32vh] sm:h-[38vh] min-h-[220px] sm:min-h-[280px] shrink-0"
          style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, 672px"
            />
          ) : (
            <div 
              className="flex items-center justify-center h-full text-xs sm:text-sm"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              No image available
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-5 space-y-3 sm:space-y-5">
          {/* Header */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              {item.name}
            </h2>
            {item.description && (
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {item.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="text-lg sm:text-xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
            {formatCurrency(item.price)}
          </div>

          {/* Dietary Info & Allergens */}
          {(item.isVegetarian || item.isVegan || item.isGlutenFree || (item.allergens && item.allergens.length > 0)) && (
            <div className="space-y-2">
              {(item.isVegetarian || item.isVegan || item.isGlutenFree) && (
                <div className="flex flex-wrap gap-1.5">
                  {item.isVegetarian && (
                    <span 
                      className="px-2.5 py-0.5 text-[11px] sm:text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: 'hsla(var(--primary), 0.1)', 
                        color: 'hsl(var(--primary))' 
                      }}
                    >
                      Vegetarian
                    </span>
                  )}
                  {item.isVegan && (
                    <span 
                      className="px-2.5 py-0.5 text-[11px] sm:text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: 'hsla(var(--primary), 0.1)', 
                        color: 'hsl(var(--primary))' 
                      }}
                    >
                      Vegan
                    </span>
                  )}
                  {item.isGlutenFree && (
                    <span 
                      className="px-2.5 py-0.5 text-[11px] sm:text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: 'hsla(var(--primary), 0.1)', 
                        color: 'hsl(var(--primary))' 
                      }}
                    >
                      Gluten-Free
                    </span>
                  )}
                </div>
              )}

              {item.allergens && item.allergens.length > 0 && (
                <div className="text-xs sm:text-sm">
                  <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    Allergens:
                  </span>{' '}
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {item.allergens.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Customization Options */}
          {item.customizationGroups && item.customizationGroups.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              {item.customizationGroups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="font-semibold text-sm sm:text-base" style={{ color: 'hsl(var(--foreground))' }}>
                    {group.name}
                    {group.isRequired && (
                      <span style={{ color: 'hsl(var(--destructive))' }} className="ml-1">*</span>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {group.options.map((option) => {
                      const isSelected = (selectedOptions[group.id] || []).includes(option.id);
                      const inputType = group.type === 'RADIO' ? 'radio' : 'checkbox';

                      return (
                        <label
                          key={option.id}
                          className={cn(
                            'flex items-center justify-between p-2.5 sm:p-3 rounded-lg border-2 cursor-pointer transition-all duration-200'
                          )}
                          style={
                            isSelected
                              ? {
                                  borderColor: 'hsl(var(--primary))',
                                  backgroundColor: 'hsla(var(--primary), 0.08)',
                                }
                              : {
                                  borderColor: 'hsl(var(--border))',
                                }
                          }
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <input
                              type={inputType}
                              name={group.id}
                              checked={isSelected}
                              onChange={() => handleOptionChange(group.id, option.id, group.type)}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 focus:ring-2"
                              style={{
                                accentColor: 'hsl(var(--primary))',
                              }}
                            />
                            <span className="font-medium text-xs sm:text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                              {option.name}
                            </span>
                          </div>
                          {option.priceModifier !== 0 && (
                            <span className="text-xs sm:text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {option.priceModifier > 0 ? '+' : ''}
                              {formatCurrency(option.priceModifier)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="font-semibold text-sm sm:text-base" style={{ color: 'hsl(var(--foreground))' }}>
              Special Instructions <span className="font-normal text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>(Optional)</span>
            </label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests?"
              className="min-h-[70px] sm:min-h-[80px] text-xs sm:text-sm resize-none"
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            />
          </div>

          {/* Quantity Selector */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="font-semibold text-sm sm:text-base" style={{ color: 'hsl(var(--foreground))' }}>
              Quantity
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg transition-all"
                style={{ 
                  borderColor: 'hsl(var(--border))',
                  backgroundColor: quantity <= 1 ? 'hsl(var(--muted))' : 'transparent',
                  color: 'hsl(var(--foreground))'
                }}
              >
                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <span 
                className="text-lg sm:text-xl font-bold min-w-[3rem] text-center" 
                style={{ color: 'hsl(var(--foreground))' }}
              >
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg transition-all"
                style={{ 
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                }}
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          {/* Reviews Section */}
          {reviewsData && reviewsData.count > 0 && (
            <div 
              className="rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3"
              style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}
            >
              <h3 className="font-semibold text-base sm:text-lg" style={{ color: 'hsl(var(--foreground))' }}>
                Customer Reviews
              </h3>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-xl sm:text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  {reviewsData.average.toFixed(1)}
                </span>
                <span className="text-xs sm:text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  ({reviewsData.count} {reviewsData.count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                {reviewsData.reviews.slice(0, 5).map((review) => (
                  <div 
                    key={review.id} 
                    className="pb-2 sm:pb-3 border-b last:border-b-0"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="font-medium text-xs sm:text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {review.customer.name}
                        </span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                'w-2.5 h-2.5 sm:w-3 sm:h-3',
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-300 text-gray-300'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {reviewsData.count > 5 && (
                <p className="text-[10px] sm:text-xs text-center pt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Showing 5 of {reviewsData.count} reviews
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sticky Bottom: Total & Add to Cart */}
        <div 
          className="border-t px-4 py-3 sm:px-6 sm:py-4 shrink-0 space-y-2.5 sm:space-y-3"
          style={{ 
            borderColor: 'hsl(var(--border))', 
            backgroundColor: 'hsl(var(--card))' 
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Total
            </span>
            <span className="text-xl sm:text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
              {formatCurrency(calculateTotal())}
            </span>
          </div>
          <Button
            onClick={handleAddToCart}
            className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}