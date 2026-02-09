// src/lib/sendgrid.ts

import sgMail from '@sendgrid/mail';
import { prisma } from '@/lib/prisma';

export async function getSendGridConfig(restaurantId: string): Promise<{
  client: any;
  fromEmail: string;
} | null> {
  try {
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

    const apiKeySetting = restaurant.settings.find(s => s.key === 'sendgridApiKey');
    const fromEmailSetting = restaurant.settings.find(s => s.key === 'sendgridFromEmail');
    
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

    // Initialize SendGrid with API key
    sgMail.setApiKey(apiKey);

    return {
      client: sgMail,
      fromEmail
    };
  } catch (error) {
    console.error('Error getting SendGrid config:', error);
    return null;
  }
}

export default null;
export const FROM_EMAIL = 'DEPRECATED_USE_getSendGridConfig';
export const isSendGridConfigured = false;