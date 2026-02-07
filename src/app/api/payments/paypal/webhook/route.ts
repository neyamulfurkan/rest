import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ORDER_STATUS } from '@/lib/constants';
import { PaymentStatus, OrderStatus } from '@prisma/client';

/**
 * PayPal webhook endpoint
 * Handles payment events from PayPal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    
    // Parse PayPal webhook event
    const event = JSON.parse(body);
    
    console.log(`Processing PayPal event: ${event.event_type}`);

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptured(event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(event);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentRefunded(event);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

async function handlePaymentCaptured(event: any): Promise<void> {
  try {
    const captureId = event.resource.id;
    const customId = event.resource.custom_id;

    if (!customId) {
      console.error('No order ID in PayPal webhook');
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: customId },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
          paymentIntentId: captureId,
          status: ORDER_STATUS.ACCEPTED as OrderStatus,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: customId,
          status: ORDER_STATUS.ACCEPTED as OrderStatus,
          note: 'Payment completed via PayPal webhook',
          createdBy: 'SYSTEM',
        },
      });
    });

    console.log(`PayPal payment captured for order ${customId}`);
  } catch (error) {
    console.error('Error handling PayPal payment captured:', error);
    throw error;
  }
}

async function handlePaymentDenied(event: any): Promise<void> {
  try {
    const customId = event.resource.custom_id;

    if (!customId) return;

    await prisma.order.update({
      where: { id: customId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    console.log(`PayPal payment denied for order ${customId}`);
  } catch (error) {
    console.error('Error handling PayPal payment denied:', error);
    throw error;
  }
}

async function handlePaymentRefunded(event: any): Promise<void> {
  try {
    const customId = event.resource.custom_id;

    if (!customId) return;

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: customId },
        select: { totalAmount: true },
      });

      await tx.order.update({
        where: { id: customId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          status: ORDER_STATUS.CANCELLED as OrderStatus,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: customId,
          status: ORDER_STATUS.CANCELLED as OrderStatus,
          note: 'Payment refunded via PayPal',
          createdBy: 'SYSTEM',
        },
      });

      // Restore inventory for refunded items
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: customId },
        include: { menuItem: true },
      });

      for (const item of orderItems) {
        if (item.menuItem.trackInventory && item.menuItem.stockQuantity !== null) {
          await tx.menuItem.update({
            where: { id: item.menuItemId },
            data: {
              stockQuantity: { increment: item.quantity },
            },
          });
        }
      }

      // Update customer stats (only decrement totalSpent, NOT totalOrders)
      if (order) {
        await tx.customer.updateMany({
          where: {
            orders: {
              some: { id: customId }
            }
          },
          data: {
            totalSpent: { decrement: order.totalAmount },
          },
        });
      }
    });

    console.log(`PayPal refund processed for order ${customId}`);
  } catch (error) {
    console.error('Error handling PayPal refund:', error);
    throw error;
  }
}