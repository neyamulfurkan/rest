// src/lib/sendgrid.ts

import sgMail from '@sendgrid/mail';
import { prisma } from '@/lib/prisma';

/**
 * Get SendGrid configuration for a specific restaurant
 * @param restaurantId - Restaurant ID
 * @returns SendGrid client and from email, or null if not configured
 */
export async function getSendGridConfig(restaurantId: string): Promise<{
  client: typeof sgMail;
  fromEmail: string;
} | null> {
  try {
    // Fetch restaurant settings from database
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        settings: {
          where: {
            key: {
              in: ['sendgridApiKey', 'sendgridFromEmail']
            }
          }
        }
      }
    });

    if (!restaurant || !restaurant.settings || restaurant.settings.length === 0) {
      console.warn(`SendGrid not configured for restaurant ${restaurantId}`);
      return null;
    }

    // Extract settings
    const apiKeySetting = restaurant.settings.find(s => s.key === 'sendgridApiKey');
    const fromEmailSetting = restaurant.settings.find(s => s.key === 'sendgridFromEmail');

    // Parse JSON values (settings are stored as JSON strings)
    let apiKey: string | null = null;
    let fromEmail: string | null = null;

    try {
      apiKey = apiKeySetting ? JSON.parse(apiKeySetting.value) : null;
      fromEmail = fromEmailSetting ? JSON.parse(fromEmailSetting.value) : null;
    } catch (error) {
      console.error(`Failed to parse SendGrid settings for restaurant ${restaurantId}:`, error);
      return null;
    }

    if (!apiKey || !fromEmail) {
      console.warn(`Incomplete SendGrid config for restaurant ${restaurantId}`);
      return null;
    }

    // Create a new SendGrid client instance for this restaurant
    const client = require('@sendgrid/mail');
    client.setApiKey(apiKey);

    return {
      client,
      fromEmail
    };
  } catch (error) {
    console.error('Error getting SendGrid config:', error);
    return null;
  }
}

// Legacy export for backward compatibility (will log warning)
export default sgMail;
export const FROM_EMAIL = 'DEPRECATED_USE_getSendGridConfig';
export const isSendGridConfigured = false;