// src/components/customer/Footer.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';

export default function Footer() {
  const [mounted, setMounted] = useState(false);
  const { 
    restaurantName, 
    email, 
    phone, 
    address, 
    branding 
  } = useSettingsStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentYear = new Date().getFullYear();

  // Don't render anything until client-side mounted
  if (!mounted) {
    return (
      <footer className="bg-neutral-900 text-neutral-100">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="h-24" />
            <div className="h-24" />
            <div className="h-24" />
            <div className="h-24" />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer 
      style={{ 
        backgroundColor: branding.footerBgColor,
        color: branding.footerTextColor 
      }}
    >
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 
              className="text-lg font-bold mb-4"
              style={{ color: branding.footerTextColor }}
            >
              About Us
            </h3>
            <p 
              className="text-sm opacity-80"
              style={{ color: branding.footerTextColor }}
            >
              {restaurantName} - Experience the finest dining with our carefully crafted menu and exceptional service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 
              className="text-lg font-bold mb-4"
              style={{ color: branding.footerTextColor }}
            >
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ color: branding.footerTextColor }}
                  onClick={() => window.location.href = '/menu'}
                >
                  Menu
                </span>
              </li>
              <li>
                <span
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ color: branding.footerTextColor }}
                  onClick={() => window.location.href = '/booking'}
                >
                  Bookings
                </span>
              </li>
              <li>
                <span
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ color: branding.footerTextColor }}
                  onClick={() => window.location.href = '/contact'}
                >
                  Contact
                </span>
              </li>
              <li>
                <span
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ color: branding.footerTextColor }}
                  onClick={() => window.location.href = '/account/orders'}
                >
                  Track Order
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 
              className="text-lg font-bold mb-4"
              style={{ color: branding.footerTextColor }}
            >
              Contact Info
            </h3>
            <ul className="space-y-3 text-sm">
              {phone && (
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ color: branding.footerTextColor }}
                    onClick={() => window.location.href = `tel:${phone}`}
                  >
                    {phone}
                  </span>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ color: branding.footerTextColor }}
                    onClick={() => window.location.href = `mailto:${email}`}
                  >
                    {email}
                  </span>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span style={{ color: branding.footerTextColor }}>
                    {address}
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 
              className="text-lg font-bold mb-4"
              style={{ color: branding.footerTextColor }}
            >
              Follow Us
            </h3>
            <div className="flex gap-4">
              {useSettingsStore.getState().facebookUrl && (
                <span
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  aria-label="Facebook"
                  onClick={() => window.open(useSettingsStore.getState().facebookUrl || '#', '_blank', 'noopener,noreferrer')}
                >
                  <Facebook className="w-6 h-6" style={{ color: branding.footerTextColor }} />
                </span>
              )}
              {useSettingsStore.getState().instagramUrl && (
                <span
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  aria-label="Instagram"
                  onClick={() => window.open(useSettingsStore.getState().instagramUrl || '#', '_blank', 'noopener,noreferrer')}
                >
                  <Instagram className="w-6 h-6" style={{ color: branding.footerTextColor }} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="mt-8 pt-8 border-t border-opacity-20 text-center text-sm"
          style={{ 
            borderColor: branding.footerTextColor,
            color: branding.footerTextColor 
          }}
        >
          <p className="opacity-80">
            © {currentYear} {restaurantName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}