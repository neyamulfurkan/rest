// src/app/api/notifications/sms/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/services/notificationService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============= VALIDATION SCHEMA =============

const sendSMSSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
  to: z.string().min(1, 'Recipient phone number is required'),
  message: z.string().min(1, 'Message content is required').max(1600, 'Message too long (max 1600 characters)'),
  metadata: z.record(z.unknown()).optional(),
});

// ============= POST HANDLER =============

/**
 * Send SMS notification
 * @route POST /api/notifications/sms
 * @body { to: string, message: string, metadata?: object }
 * @returns { success: boolean, messageId?: string, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request data
    const validated = sendSMSSchema.parse(body);

    // Get restaurantId from request body
    const { restaurantId } = body;

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Verify restaurant exists and is active
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, isActive: true },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (!restaurant.isActive) {
      return NextResponse.json(
        { success: false, error: 'Restaurant is not active' },
        { status: 403 }
      );
    }

    // Send SMS via notification service
    const result = await sendSMS(validated.to, validated.message, restaurant.id);

    // Return result
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          messageId: result.messageId,
          message: 'SMS sent successfully',
        },
        { status: 200 }
      );
    } else {
      // SMS sending failed
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send SMS',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    // Log unexpected errors
    console.error('SMS API Error:', error);

    // Return generic error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}