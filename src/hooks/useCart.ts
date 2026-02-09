// src/hooks/useCart.ts

import { useCartStore } from '@/store/cartStore';
import { toast } from '@/hooks/use-toast';
import type { CartItem } from '@/types';

/**
 * Cart hook with side effects (toasts, analytics)
 * Wraps the Zustand cart store and adds user feedback
 */
export function useCart() {
  const store = useCartStore();

  // Wrapped addItem with toast notification
  const addItem = (
    item: {
      menuItemId: string;
      name: string;
      price: number;
    },
    quantity: number = 1,
    customizations?: {
      groupName: string;
      optionName: string;
      price: number;
    }[],
    specialInstructions?: string
  ) => {
    store.addItem(item, quantity, customizations, specialInstructions);
    
    toast({
      title: "Added to cart",
      description: `${item.name} (Qty: ${quantity})`,
    });

    // Optional: Track analytics
    if (typeof window !== 'undefined') {
      const win = window as unknown as { gtag?: (...args: unknown[]) => void };
      if (win.gtag) {
        win.gtag('event', 'add_to_cart', {
          currency: 'USD',
          value: item.price * quantity,
          items: [
            {
              item_id: item.menuItemId,
              item_name: item.name,
              price: item.price,
              quantity: quantity,
            },
          ],
        });
      }
    }
  };

  // Wrapped removeItem with toast notification
  const removeItem = (menuItemId: string) => {
    const itemToRemove = store.items.find(
      (item) => item.menuItemId === menuItemId
    );
    
    store.removeItem(menuItemId);
    
    if (itemToRemove) {
      toast({
        title: "Removed from cart",
        description: itemToRemove.name,
      });

      // Optional: Track analytics
      if (typeof window !== 'undefined') {
        const win = window as unknown as { gtag?: (...args: unknown[]) => void };
        if (win.gtag) {
          win.gtag('event', 'remove_from_cart', {
            currency: 'USD',
            value: itemToRemove.price * itemToRemove.quantity,
            items: [
              {
                item_id: itemToRemove.menuItemId,
                item_name: itemToRemove.name,
                price: itemToRemove.price,
                quantity: itemToRemove.quantity,
              },
            ],
          });
        }
      }
    }
  };

  // Wrapped updateQuantity with validation
  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity < 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity cannot be negative",
        variant: "destructive",
      });
      return;
    }

    if (quantity === 0) {
      // Removing item
      removeItem(menuItemId);
      return;
    }

    store.updateQuantity(menuItemId, quantity);
  };

  // Wrapped clearCart with confirmation
  const clearCart = () => {
    const itemCount = store.getItemCount();
    
    if (itemCount === 0) {
      toast({
        title: "Cart is empty",
        description: "No items to remove",
      });
      return;
    }

    store.clearCart();
    
    toast({
      title: "Cart cleared",
      description: `${itemCount} item${itemCount > 1 ? 's' : ''} removed`,
    });
  };

  // Computed values
  const subtotal = store.getTotal();
  const itemCount = store.getItemCount();
  const isEmpty = itemCount === 0;

  // Get cart items
  const items = store.items;

  // Check if specific item is in cart
  const hasItem = (menuItemId: string): boolean => {
    return items.some((item) => item.menuItemId === menuItemId);
  };

  // Get quantity of specific item in cart
  const getItemQuantity = (menuItemId: string): number => {
    const item = items.find((item) => item.menuItemId === menuItemId);
    return item?.quantity ?? 0;
  };

  // Get item by ID (useful for cart sidebar)
  const getItem = (menuItemId: string): CartItem | undefined => {
    return items.find((item) => item.menuItemId === menuItemId);
  };

  return {
    // State
    items,
    subtotal,
    itemCount,
    isEmpty,
    
    // Actions (with side effects)
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // Utility methods
    hasItem,
    getItemQuantity,
    getItem,
    
    // Direct store methods (if needed)
    getTotal: store.getTotal,
  };
}