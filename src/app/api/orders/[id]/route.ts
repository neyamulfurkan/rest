// src/app/api/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';

import {
  getOrderById,
  updateOrderStatus,
} from '@/services/orderService';
import { z } from 'zod';

// Validation schema for status update
const updateStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'REJECTED',
  ]),
  note: z.string().optional(),
});

/**
 * GET /api/orders/[id]
 * Fetch a single order by ID with all relations
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orderId = params.id;

    // Fetch order with all relations
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check authorization: customer can only see their own orders, staff can see all
    const userRole = (session.user as any)?.role;
    const isStaffRole = userRole && ['ADMIN', 'KITCHEN', 'WAITER'].includes(userRole);
    const isOrderOwner = order.customerId === (session.user as any)?.id;

    if (!isStaffRole && !isOrderOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only view your own orders' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 * Update order status (admin/staff or customer cancellation)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orderId = params.id;
    const body = await request.json();

    // Check if this is a customer cancellation request
    const isCustomerCancellation = body.status === 'CANCELLED' && !body.note;
    const userRole = (session.user as any)?.role;
    const isStaff = userRole && ['ADMIN', 'KITCHEN', 'WAITER'].includes(userRole);

    if (isCustomerCancellation) {
      // Customer cancellation logic
      const existingOrder = await getOrderById(orderId);

      if (!existingOrder) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      // Check if user owns this order
      if (existingOrder.customerId !== (session.user as any)?.id) {
        return NextResponse.json(
          { success: false, error: 'You can only cancel your own orders' },
          { status: 403 }
        );
      }

      // Only allow cancellation if order is PENDING or ACCEPTED
      if (!['PENDING', 'ACCEPTED'].includes(existingOrder.status)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Order cannot be cancelled. It is already being prepared or completed.' 
          },
          { status: 400 }
        );
      }

      // Update order status to CANCELLED
      await updateOrderStatus(
        orderId,
        {
          status: 'CANCELLED',
          note: 'Cancelled by customer',
        },
        (session.user as any)?.id || 'CUSTOMER'
      );

      // Fetch updated order with relations for notification
      const updatedOrder = await getOrderById(orderId);

      // Send status update notification
      if (updatedOrder) {
        try {
          const { sendOrderStatusUpdate } = await import('@/services/notificationService');
          await sendOrderStatusUpdate(updatedOrder).catch(err =>
            console.error('Failed to send order status update:', err)
          );
        } catch (error) {
          console.error('Notification service error:', error);
        }
      }

      return NextResponse.json({
        success: true,
        data: updatedOrder,
        message: 'Order cancelled successfully',
      });
    }

    // Staff update order status logic
    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only staff can update order status' },
        { status: 403 }
      );
    }

    // Verify order exists
    const staffOrder = await getOrderById(orderId);

    if (!staffOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const validated = updateStatusSchema.parse(body);

    // Update order status
    await updateOrderStatus(
      orderId,
      {
        status: validated.status as any,
        note: validated.note,
      },
      (session.user as any)?.id || 'SYSTEM'
    );

    // Fetch updated order with relations for notification
    const updatedOrder = await getOrderById(orderId);

    // Send status update notification
    if (updatedOrder) {
      try {
        const { sendOrderStatusUpdate } = await import('@/services/notificationService');
        await sendOrderStatusUpdate(updatedOrder).catch(err =>
          console.error('Failed to send order status update:', err)
        );
      } catch (error) {
        console.error('Notification service error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Error updating order status:', error);

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

    // Handle business logic errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order status',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders/[id]
 * Submit a review OR report an issue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orderId = params.id;
    const body = await request.json();

    // Get order to verify ownership
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const userRole = (session.user as any)?.role;
    const isStaffRole = userRole && ['ADMIN', 'KITCHEN', 'WAITER'].includes(userRole);
    const isOrderOwner = order.customerId === (session.user as any)?.id;

    if (!isStaffRole && !isOrderOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Handle review submission
    if (body.action === 'review') {
      const { rating, comment, menuItemId } = body;

      // Validate review
      if (!rating || rating < 1 || rating > 5) {
        return NextResponse.json(
          { success: false, error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }

      if (!menuItemId) {
        return NextResponse.json(
          { success: false, error: 'Menu item ID is required' },
          { status: 400 }
        );
      }

      // Check if order is delivered/completed
      if (order.status !== 'DELIVERED') {
        return NextResponse.json(
          { success: false, error: 'Can only review completed orders' },
          { status: 400 }
        );
      }

      // Check if already reviewed
      const { prisma } = await import('@/lib/prisma');
      const existingReview = await prisma.review.findUnique({
        where: {
          customerId_orderId_menuItemId: {
            customerId: (session.user as any).id,
            orderId: orderId,
            menuItemId: menuItemId,
          },
        },
      });

      if (existingReview) {
        return NextResponse.json(
          { success: false, error: 'You have already reviewed this item' },
          { status: 400 }
        );
      }

      // Create review
      const review = await prisma.review.create({
        data: {
          rating,
          comment: comment || null,
          customerId: (session.user as any).id,
          menuItemId,
          orderId,
          restaurantId: order.restaurantId,
          isApproved: true, // Auto-approve for basic system
        },
      });

      return NextResponse.json({
        success: true,
        data: review,
        message: 'Review submitted successfully',
      });
    }

    // Handle issue report (existing functionality)
    if (body.issue) {
      try {
        const { sendEmail } = await import('@/services/notificationService');
        const restaurantEmail = (order as any).restaurant?.email || process.env.SENDGRID_FROM_EMAIL || 'noreply@restaurant.com';
        await sendEmail(
          restaurantEmail,
          `Order Issue Reported - ${order.orderNumber}`,
          `
            <h2>Order Issue Report</h2>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Customer:</strong> ${order.customer.name} (${order.customer.email})</p>
            <p><strong>Customer Phone:</strong> ${order.customer.phone || 'N/A'}</p>
            <p><strong>Issue Description:</strong></p>
            <p>${body.issue}</p>
          `,
          order.restaurantId
        );
      } catch (error) {
        console.error('Failed to send issue report email:', error);
      }

      return NextResponse.json({
        success: true,
        message: 'Issue reported successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/orders/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
      },
      { status: 500 }
    );
  }
}