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

interface UpsellSuggestion {
  menuItem: MenuItemWithRelations;
  reason: string;
  confidence: number;
}

export function MenuItemModal({ item, isOpen, onClose }: MenuItemModalProps) {
  const { addItem } = useCart();
  
  // State for quantity and customizations
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [reviewsData, setReviewsData] = useState<{
    average: number;
    count: number;
    reviews: any[];
  } | null>(null);

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
        // Radio: only one selection
        return { ...prev, [groupId]: [optionId] };
      } else {
        // Checkbox: multiple selections
        if (current.includes(optionId)) {
          // Remove if already selected
          return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
        } else {
          // Add if not selected
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
    // Build customizations array for cart
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

    // Add to cart
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

    // Close modal
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
      <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0 sm:max-w-2xl w-[calc(100vw-1rem)] sm:w-full z-[10000] gap-0">
        {/* Header with manual close button for mobile */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-50">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-neutral-700" />
          </Button>
        </div>
        
        {/* Large image - responsive height */}
        <div className="relative h-[35vh] sm:h-[40vh] min-h-[250px] sm:min-h-[300px] bg-neutral-100 shrink-0">
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
            <div className="flex items-center justify-center h-full text-neutral-400 text-sm sm:text-base">
              No image available
            </div>
          )}
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Item details */}
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{item.name}</DialogTitle>
            {item.description && (
              <DialogDescription className="text-base text-neutral-600 mt-2">
                {item.description}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Price */}
          <div className="text-lg sm:text-xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
            {formatCurrency(item.price)}
          </div>

          {/* Dietary info and allergens */}
          {(item.isVegetarian || item.isVegan || item.isGlutenFree || (item.allergens && item.allergens.length > 0)) && (
            <div className="space-y-2">
              {/* Dietary badges */}
              {(item.isVegetarian || item.isVegan || item.isGlutenFree) && (
                <div className="flex flex-wrap gap-2">
                  {item.isVegetarian && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>
                      Vegetarian
                    </span>
                  )}
                  {item.isVegan && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>
                      Vegan
                    </span>
                  )}
                  {item.isGlutenFree && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>
                      Gluten-Free
                    </span>
                  )}
                </div>
              )}

              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <div className="text-sm">
                  <span className="font-semibold text-neutral-700">Allergens:</span>{' '}
                  <span className="text-neutral-600">{item.allergens.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Customization options */}
          {item.customizationGroups && item.customizationGroups.length > 0 && (
            <div className="space-y-4">
              {item.customizationGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <div className="font-semibold text-neutral-900">
                    {group.name}
                    {group.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </div>

                  <div className="space-y-2">
                    {group.options.map((option) => {
                      const isSelected = (selectedOptions[group.id] || []).includes(option.id);
                      const inputType = group.type === 'RADIO' ? 'radio' : 'checkbox';

                      return (
                        <label
                          key={option.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-opacity-10'
                              : 'border-neutral-200 hover:border-neutral-300'
                          )}
                          style={
                            isSelected
                              ? {
                                  borderColor: 'hsl(var(--primary))',
                                  backgroundColor: 'hsla(var(--primary), 0.1)',
                                }
                              : undefined
                          }
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type={inputType}
                              name={group.id}
                              checked={isSelected}
                              onChange={() => handleOptionChange(group.id, option.id, group.type)}
                              className="w-4 h-4 focus:ring-2"
                              style={{
                                accentColor: 'hsl(var(--primary))',
                              }}
                            />
                            <span className="font-medium text-neutral-900">{option.name}</span>
                          </div>
                          {option.priceModifier !== 0 && (
                            <span className="text-sm text-neutral-600">
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

          {/* Special instructions */}
          <div className="space-y-2">
            <label className="font-semibold text-neutral-900">
              Special Instructions (Optional)
            </label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests?"
              className="min-h-[80px]"
            />
          </div>

          {/* Quantity selector */}
          <div className="space-y-2">
            <label className="font-semibold text-sm sm:text-base" style={{ color: 'hsl(var(--foreground))' }}>Quantity</label>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <span className="text-lg sm:text-xl font-semibold min-w-[3rem] text-center" style={{ color: 'hsl(var(--foreground))' }}>{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky bottom: Total and Add to Cart button */}
        <div className="border-t p-4 sm:p-6 bg-white shrink-0" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-base sm:text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Total</span>
            <span className="text-xl sm:text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
              {formatCurrency(calculateTotal())}
            </span>
          </div>
          <Button
            onClick={handleAddToCart}
            className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            Add to Cart
          </Button>
        </div>

        {/* Reviews Section - Before closing DialogContent */}
        {reviewsData && reviewsData.count > 0 && (
          <div className="border-t p-4 sm:p-6 shrink-0" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
            <h3 className="font-semibold text-lg mb-3">Customer Reviews</h3>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">{reviewsData.average.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviewsData.count} {reviewsData.count === 1 ? 'review' : 'reviews'})</span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {reviewsData.reviews.slice(0, 5).map((review: any) => (
                <div key={review.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.customer.name}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
            {reviewsData.count > 5 && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                Showing 5 of {reviewsData.count} reviews
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}