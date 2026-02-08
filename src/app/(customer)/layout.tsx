// src/app/(customer)/layout.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/customer/Header';
import Footer from '@/components/customer/Footer';
import { CartSidebar } from '@/components/customer/CartSidebar';
import ChatbotWidget from '@/components/customer/ChatbotWidget';
import { useSettingsStore } from '@/store/settingsStore';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { branding } = useSettingsStore();

  const handleOpenCart = () => setIsCartOpen(true);
  const handleCloseCart = () => setIsCartOpen(false);

  // Get restaurant ID from settings or default
  const restaurantId = 'rest123456789';

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
        // Transparent header = transparent bottom nav
        metaThemeColor.setAttribute('content', 'transparent');
      } else {
        // Use header background color
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
    </>
  );
}