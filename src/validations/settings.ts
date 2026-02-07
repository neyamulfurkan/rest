// src/validations/settings.ts

import { z } from 'zod';

export const galleryItemSchema = z.object({
  url: z.string(),
  caption: z.string().optional(),
  order: z.number().optional(),
}).passthrough();

export const aboutContentSchema = z.object({
  story: z.string().optional().nullable(),
  mission: z.string().optional().nullable(),
  values: z.string().optional().nullable(),
});

export const settingsSchema = z.object({
  // Gallery & About
  galleryImages: z.union([z.array(galleryItemSchema), z.string()]).optional().nullable().transform((val) => {
    if (typeof val === 'string') {
      // Filter out console.log contaminated strings
      if (val.includes('console.log') || val.includes('page.tsx') || val.includes('🔵')) {
        return [];
      }
      try {
        const parsed = JSON.parse(val);
        // Validate parsed array items
        if (Array.isArray(parsed)) {
          return parsed.filter(item => 
            item && 
            typeof item === 'object' && 
            item.url && 
            !item.caption?.includes('console.log')
          );
        }
        return [];
      } catch {
        return [];
      }
    }
    return val || [];
  }),
  aboutStory: z.string().optional().nullable().transform(val => {
    if (!val || val.includes('console.log') || val.includes('page.tsx') || val.includes('🔵')) return null;
    return val.trim() || null;
  }),
  aboutMission: z.string().optional().nullable().transform(val => {
    if (!val || val.includes('console.log') || val.includes('page.tsx') || val.includes('🔵')) return null;
    return val.trim() || null;
  }),
  aboutValues: z.string().optional().nullable().transform(val => {
    if (!val || val.includes('console.log') || val.includes('page.tsx') || val.includes('🔵')) return null;
    return val.trim() || null;
  }),
  
  // Existing fields
  restaurantName: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  heroImageUrl: z.string().nullable().optional(),
  heroMediaType: z.enum(['image', 'video', 'slideshow']).optional(),
  heroVideoUrl: z.string().nullable().optional(),
  heroImages: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val || [];
  }),
  heroSlideshowEnabled: z.boolean().optional(),
  heroSlideshowInterval: z.union([z.number(), z.string()]).optional().nullable().transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseInt(val);
      return isNaN(parsed) ? 5000 : parsed;
    }
    return val || 5000;
  }),
  floorPlanImageUrl: z.string().nullable().optional(),
  description: z.string().optional().nullable(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  operatingHours: z.union([
    z.record(
      z.object({
        open: z.string(),
        close: z.string(),
        closed: z.boolean().optional(),
      })
    ),
    z.string()
  ]).optional().transform((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return {};
      }
    }
    return val;
  }),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  pageBgColor: z.string().optional(),
  bodyColor: z.string().optional(),
  bodyTextColor: z.string().optional(),
  footerBgColor: z.string().optional(),
  footerTextColor: z.string().optional(),
  fontFamily: z.string().optional(),
  headerBgColor: z.string().optional(),
  headerTextColor: z.string().optional(),
  headerTransparentOverMedia: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  serviceFee: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional(),
  enableDineIn: z.boolean().optional(),
  enablePickup: z.boolean().optional(),
  enableDelivery: z.boolean().optional(),
  enableGuestCheckout: z.boolean().optional(),
  autoConfirmBookings: z.boolean().optional(),
  maxGuestsPerBooking: z.number().optional(),
  bookingTimeSlotInterval: z.number().optional(),
  bookingBufferTime: z.number().optional(),
  noShowDepositEnabled: z.boolean().optional(),
  noShowDepositAmount: z.number().min(0).optional(),
  reminderTiming: z.number().optional(),
  bookingDepositAmount: z.number().min(0).optional(),
  stripePublishableKey: z.string().optional().nullable(),
  stripeSecretKey: z.string().optional().nullable(),
  paypalClientId: z.string().optional().nullable(),
  paypalClientSecret: z.string().optional().nullable(),
  stripeWebhookSecret: z.string().optional().nullable(),
  squareAccessToken: z.string().optional().nullable(),
  cashOnDeliveryEnabled: z.boolean().optional(),
  twilioAccountSid: z.string().optional().nullable(),
  twilioAuthToken: z.string().optional().nullable(),
  twilioPhoneNumber: z.string().optional().nullable(),
  sendgridApiKey: z.string().optional().nullable(),
  sendgridFromEmail: z.string().optional().nullable(),
  kitchenPrinterIp: z.string().optional().nullable(),
  facebookUrl: z.string().optional().nullable(),
  instagramUrl: z.string().optional().nullable(),
  googleMapsApiKey: z.string().optional().nullable(),
  googleAnalyticsId: z.string().optional().nullable(),
  groqApiKey: z.string().optional().nullable(),
  enableAiFeatures: z.boolean().optional(),
  cloudinaryCloudName: z.string().optional().nullable(),
  cloudinaryApiKey: z.string().optional().nullable(),
  cloudinaryApiSecret: z.string().optional().nullable(),
  cloudinaryAutoOptimize: z.boolean().optional(),
  cloudinaryAutoFormat: z.boolean().optional(),
}).passthrough();