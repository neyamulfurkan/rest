// src/lib/stripe.ts

import Stripe from 'stripe';

/**
 * Stripe client instance for server-side operations
 * Configured with the latest API version for consistency
 * Lazy initialization to avoid build-time errors
 */
let stripeInstance: Stripe | null = null;

export const stripe = (() => {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
      appInfo: {
        name: 'RestaurantOS',
        version: '1.0.0',
      },
    });
  }
  return stripeInstance;
})();