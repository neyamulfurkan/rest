import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, sendEmail } from '@/services/notificationService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, restaurantId } = body;

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID required' },
        { status: 400 }
      );
    }

    // Get restaurant details
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { email: true, phone: true },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (type === 'sms') {
      if (!restaurant.phone) {
        return NextResponse.json(
          { success: false, error: 'Restaurant phone number not configured' },
          { status: 400 }
        );
      }

      const result = await sendSMS(
        restaurant.phone,
        'Test SMS from RestaurantOS - Your SMS notifications are working!',
        restaurantId
      );

      return NextResponse.json(result);
    }

    if (type === 'email') {
      if (!restaurant.email) {
        return NextResponse.json(
          { success: false, error: 'Restaurant email not configured' },
          { status: 400 }
        );
      }

      const result = await sendEmail(
        restaurant.email,
        'Test Email from RestaurantOS',
        '<h1>Success!</h1><p>Your email notifications are working correctly.</p>',
        restaurantId
      );

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid notification type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Test failed' 
      },
      { status: 500 }
    );
  }
}