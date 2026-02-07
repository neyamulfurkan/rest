// src/app/api/cron/booking-reminders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBookingReminder } from '@/services/notificationService';

/**
 * Cron job endpoint to send booking reminders
 * Sends 24h and 2h reminders for upcoming bookings
 * 
 * Usage:
 * - Vercel: Automatically called via vercel.json cron config
 * - Self-hosted: Call via system cron: curl -X GET http://localhost:3000/api/cron/booking-reminders -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== process.env.CRON_SECRET) {
      console.error('Unauthorized cron request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔔 Starting booking reminder job...');

    const now = new Date();
    const remindersSent = {
      reminder24h: 0,
      reminder2h: 0,
      errors: 0,
    };

    // ============= 24 HOUR REMINDERS =============
    
    // Calculate time window for 24h reminders (23h 45m to 24h 15m from now)
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const windowStart24h = new Date(twentyFourHoursFromNow.getTime() - 15 * 60 * 1000); // -15 min
    const windowEnd24h = new Date(twentyFourHoursFromNow.getTime() + 15 * 60 * 1000); // +15 min

    console.log(`📅 Checking 24h reminders between ${windowStart24h.toISOString()} and ${windowEnd24h.toISOString()}`);

    // Find bookings that need 24h reminder
    const bookingsFor24hReminder = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        reminder24hSent: false,
        date: {
          gte: windowStart24h,
          lte: windowEnd24h,
        },
      },
      include: {
        customer: true,
        table: true,
        restaurant: true,
      },
    });

    console.log(`Found ${bookingsFor24hReminder.length} bookings needing 24h reminder`);

    // Send 24h reminders
    for (const booking of bookingsFor24hReminder) {
      try {
        console.log(`Sending 24h reminder for booking ${booking.bookingNumber}`);
        await sendBookingReminder(booking, 24);
        
        // Mark as sent
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminder24hSent: true },
        });
        
        remindersSent.reminder24h++;
        console.log(`✅ 24h reminder sent for booking ${booking.bookingNumber}`);
      } catch (error) {
        console.error(`Failed to send 24h reminder for booking ${booking.bookingNumber}:`, error);
        remindersSent.errors++;
      }
    }

    // ============= 2 HOUR REMINDERS =============
    
    // Calculate time window for 2h reminders (1h 45m to 2h 15m from now)
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const windowStart2h = new Date(twoHoursFromNow.getTime() - 15 * 60 * 1000); // -15 min
    const windowEnd2h = new Date(twoHoursFromNow.getTime() + 15 * 60 * 1000); // +15 min

    console.log(`📅 Checking 2h reminders between ${windowStart2h.toISOString()} and ${windowEnd2h.toISOString()}`);

    // Find bookings that need 2h reminder
    const bookingsFor2hReminder = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        reminder2hSent: false,
        date: {
          gte: windowStart2h,
          lte: windowEnd2h,
        },
      },
      include: {
        customer: true,
        table: true,
        restaurant: true,
      },
    });

    console.log(`Found ${bookingsFor2hReminder.length} bookings needing 2h reminder`);

    // Send 2h reminders
    for (const booking of bookingsFor2hReminder) {
      try {
        console.log(`Sending 2h reminder for booking ${booking.bookingNumber}`);
        await sendBookingReminder(booking, 2);
        
        // Mark as sent
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminder2hSent: true },
        });
        
        remindersSent.reminder2h++;
        console.log(`✅ 2h reminder sent for booking ${booking.bookingNumber}`);
      } catch (error) {
        console.error(`Failed to send 2h reminder for booking ${booking.bookingNumber}:`, error);
        remindersSent.errors++;
      }
    }

    console.log('🔔 Booking reminder job completed:', remindersSent);

    return NextResponse.json({
      success: true,
      message: 'Booking reminders processed',
      stats: remindersSent,
    });
  } catch (error) {
    console.error('Booking reminder cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process booking reminders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}