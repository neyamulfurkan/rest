// src/lib/stripe.ts

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

/**
 * Dynamically get Stripe instance from database settings
 * NO environment variable fallback - 100% white-label
 */
export async function getStripeInstance(): Promise<Stripe | null> {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      select: { id: true }
    });

    if (!restaurant) {
      console.warn('⚠️ No restaurant found in database');
      return null;
    }

    const setting = await prisma.setting.findUnique({
      where: {
        restaurantId_key: {
          restaurantId: restaurant.id,
          key: 'stripeSecretKey'
        }
      }
    });

    if (!setting?.value) {
      console.warn('⚠️ Stripe secret key not configured in database settings');
      return null;
    }

    const secretKey = JSON.parse(setting.value);
    
    if (!secretKey || secretKey.trim() === '' || secretKey === 'sk_test_dummy') {
      console.warn('⚠️ Invalid Stripe secret key in database');
      return null;
    }

    return new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  } catch (error) {
    console.error('❌ Failed to get Stripe instance:', error);
    return null;
  }
}

/**
 * Get Stripe publishable key from database
 * NO environment variable fallback - 100% white-label
 */
export async function getStripePublishableKey(): Promise<string | null> {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      select: { id: true }
    });

    if (!restaurant) {
      console.warn('⚠️ No restaurant found in database');
      return null;
    }

    const setting = await prisma.setting.findUnique({
      where: {
        restaurantId_key: {
          restaurantId: restaurant.id,
          key: 'stripePublishableKey'
        }
      }
    });

    if (!setting?.value) {
      console.warn('⚠️ Stripe publishable key not configured in database settings');
      return null;
    }

    const publishableKey = JSON.parse(setting.value);
    
    if (!publishableKey || publishableKey.trim() === '' || publishableKey === 'pk_test_dummy') {
      console.warn('⚠️ Invalid Stripe publishable key in database');
      return null;
    }

    return publishableKey;
  } catch (error) {
    console.error('❌ Failed to get Stripe publishable key:', error);
    return null;
  }
}

/**
 * Get Stripe webhook secret from database
 * NO environment variable fallback - 100% white-label
 */
export async function getStripeWebhookSecret(): Promise<string | null> {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      select: { id: true }
    });

    if (!restaurant) {
      console.warn('⚠️ No restaurant found in database');
      return null;
    }

    const setting = await prisma.setting.findUnique({
      where: {
        restaurantId_key: {
          restaurantId: restaurant.id,
          key: 'stripeWebhookSecret'
        }
      }
    });

    if (!setting?.value) {
      console.warn('⚠️ Stripe webhook secret not configured in database settings');
      return null;
    }

    const webhookSecret = JSON.parse(setting.value);
    
    if (!webhookSecret || webhookSecret.trim() === '' || webhookSecret === 'whsec_dummy') {
      console.warn('⚠️ Invalid Stripe webhook secret in database');
      return null;
    }

    return webhookSecret;
  } catch (error) {
    console.error('❌ Failed to get Stripe webhook secret:', error);
    return null;
  }
}