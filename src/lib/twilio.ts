// src/lib/twilio.ts

import { prisma } from '@/lib/prisma';

export async function getTwilioConfig(restaurantId: string): Promise<{
  client: any;
  phoneNumber: string;
} | null> {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        settings: {
          where: {
            key: {
              in: ['twilioAccountSid', 'twilioAuthToken', 'twilioPhoneNumber']
            }
          }
        }
      }
    });

    if (!restaurant || !restaurant.settings || restaurant.settings.length === 0) {
      console.warn(`Twilio not configured for restaurant ${restaurantId}`);
      return null;
    }

    const accountSidSetting = restaurant.settings.find(s => s.key === 'twilioAccountSid');
    const authTokenSetting = restaurant.settings.find(s => s.key === 'twilioAuthToken');
    const phoneNumberSetting = restaurant.settings.find(s => s.key === 'twilioPhoneNumber');
    
    let accountSid: string | null = null;
    let authToken: string | null = null;
    let phoneNumber: string | null = null;

    try {
      accountSid = accountSidSetting ? JSON.parse(accountSidSetting.value) : null;
      authToken = authTokenSetting ? JSON.parse(authTokenSetting.value) : null;
      phoneNumber = phoneNumberSetting ? JSON.parse(phoneNumberSetting.value) : null;
    } catch (error) {
      console.error(`Failed to parse Twilio settings for restaurant ${restaurantId}:`, error);
      return null;
    }

    if (!accountSid || !authToken || !phoneNumber) {
      console.warn(`Incomplete Twilio config for restaurant ${restaurantId}`);
      return null;
    }

    // Dynamic import to avoid loading Twilio when not configured
    const twilio = (await import('twilio')).default;
    
    // Initialize real Twilio client
    const client = twilio(accountSid, authToken);

    return {
      client,
      phoneNumber
    };
  } catch (error) {
    console.error('Error getting Twilio config:', error);
    return null;
  }
}

export const twilioClient = null;
export const TWILIO_PHONE_NUMBER = 'DEPRECATED_USE_getTwilioConfig';
export const isTwilioConfigured = false;