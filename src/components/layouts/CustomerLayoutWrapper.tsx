// src/components/layouts/CustomerLayoutWrapper.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/customer/Header';
import Footer from '@/components/customer/Footer';
import { CartSidebar } from '@/components/customer/CartSidebar';
import ChatbotWidget from '@/components/customer/ChatbotWidget';
import { useSettingsStore } from '@/store/settingsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomerLayoutWrapperProps {
  children: React.ReactNode;
}

export default function CustomerLayoutWrapper({ children }: CustomerLayoutWrapperProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { branding } = useSettingsStore();
  const { data: session } = useSession();
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCart = () => setIsCartOpen(true);
  const handleCloseCart = () => setIsCartOpen(false);

  // Get restaurant ID from settings or default
  const restaurantId = 'rest123456789';

  // Check for review prompt
  useEffect(() => {
    const checkForReviewPrompt = async () => {
      if (!session?.user?.id) return;

      const shownInSession = sessionStorage.getItem('reviewPromptShown');
      if (shownInSession === 'true') return;

      try {
        const customerResponse = await fetch(`/api/customers/${session.user.id}`);
        if (!customerResponse.ok) return;

        const customerData = await customerResponse.json();
        const customer = customerData.data;

        if (customer.reviewPromptsShown >= 3) return;

        const ordersResponse = await fetch(`/api/orders?customerId=${session.user.id}&status=DELIVERED`);
        if (!ordersResponse.ok) return;

        const ordersData = await ordersResponse.json();
        const deliveredOrders = ordersData.data || [];

        for (const order of deliveredOrders) {
          const reviewsResponse = await fetch(`/api/admin/reviews?orderId=${order.id}`);
          const reviewsData = await reviewsResponse.json();
          const existingReviews = reviewsData.data || [];
          
          const reviewedItemIds = new Set(existingReviews.map((r: any) => r.menuItemId));
          const unreviewed = order.orderItems.find((item: any) => !reviewedItemIds.has(item.menuItemId));

          if (unreviewed) {
            setCurrentOrder(order);
            setCurrentItem(unreviewed);
            setShowReviewPrompt(true);
            sessionStorage.setItem('reviewPromptShown', 'true');
            
            await fetch(`/api/customers/${session.user.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reviewPromptsShown: customer.reviewPromptsShown + 1 }),
            });
            break;
          }
        }
      } catch (error) {
        console.error('Error checking for review prompt:', error);
      }
    };

    checkForReviewPrompt();
  }, [session, toast]);

  // Update mobile browser theme color dynamically
  useEffect(() => {
    const updateThemeColor = () => {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      
      // Create meta tag if it doesn't exist
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }

      // Set color based on header transparency
      if (branding.headerTransparentOverMedia) {
        metaThemeColor.setAttribute('content', 'transparent');
      } else {
        metaThemeColor.setAttribute('content', branding.headerBgColor || '#ffffff');
      }

      // Also update Apple status bar
      let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!appleStatusBar) {
        appleStatusBar = document.createElement('meta');
        appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(appleStatusBar);
      }
      
      appleStatusBar.setAttribute('content', branding.headerTransparentOverMedia ? 'black-translucent' : 'default');
    };

    updateThemeColor();
  }, [branding.headerBgColor, branding.headerTransparentOverMedia]);

  return (
    <>
      {/* Header - Fixed at top */}
      <Header onCartOpen={handleOpenCart} />

      {/* Main Content - Add top padding to account for fixed header */}
      <main className="min-h-screen w-full overflow-x-hidden pt-16 md:pt-20" style={{ backgroundColor: 'hsl(var(--page-bg))' }}>
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Sidebar - Overlay */}
      <CartSidebar isOpen={isCartOpen} onClose={handleCloseCart} />

      {/* AI Chatbot Widget - Floating button on all customer pages */}
      <ChatbotWidget restaurantId={restaurantId} />

      {/* Review Prompt Modal */}
      <Dialog open={showReviewPrompt} onOpenChange={setShowReviewPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How was your order?</DialogTitle>
            <DialogDescription>
              We'd love to hear your feedback on {currentItem?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Tell us more about your experience (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReviewPrompt(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                onClick={async () => {
                  if (rating === 0) {
                    toast({
                      title: 'Error',
                      description: 'Please select a rating',
                      variant: 'destructive',
                    });
                    return;
                  }

                  setIsSubmitting(true);

                  try {
                    const response = await fetch(`/api/orders/${currentOrder.id}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'review',
                        rating,
                        comment,
                        menuItemId: currentItem.menuItemId,
                      }),
                    });

                    if (!response.ok) throw new Error('Failed to submit review');

                    toast({
                      title: 'Success',
                      description: 'Thank you for your review!',
                    });

                    const reviewsResponse = await fetch(`/api/admin/reviews?orderId=${currentOrder.id}`);
                    const reviewsData = await reviewsResponse.json();
                    const existingReviews = reviewsData.data || [];
                    const reviewedItemIds = new Set(existingReviews.map((r: any) => r.menuItemId));
                    reviewedItemIds.add(currentItem.menuItemId);

                    const nextUnreviewed = currentOrder.orderItems.find(
                      (item: any) => !reviewedItemIds.has(item.menuItemId)
                    );

                    if (nextUnreviewed) {
                      setCurrentItem(nextUnreviewed);
                      setRating(0);
                      setComment('');
                    } else {
                      setShowReviewPrompt(false);
                    }
                  } catch (error) {
                    console.error('Error submitting review:', error);
                    toast({
                      title: 'Error',
                      description: 'Failed to submit review. Please try again.',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="flex-1"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}