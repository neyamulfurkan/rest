// Run this with: node scripts/cleanup-pending-orders.js
// Or set up as a cron job to run every 5 minutes

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupPendingOrders() {
  try {
    console.log('🧹 Starting cleanup of abandoned orders...');

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Find abandoned orders
    const abandonedOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
        createdAt: {
          lt: fifteenMinutesAgo,
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        customer: true,
      },
    });

    console.log(`Found ${abandonedOrders.length} abandoned orders`);

    for (const order of abandonedOrders) {
      await prisma.$transaction(async (tx) => {
        // Cancel the order
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
          },
        });

        // Create status history
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: 'CANCELLED',
            note: 'Order cancelled automatically - payment not completed within 15 minutes',
            createdBy: 'SYSTEM',
          },
        });

        // Restore inventory
        for (const item of order.orderItems) {
          if (item.menuItem.trackInventory && item.menuItem.stockQuantity !== null) {
            await tx.menuItem.update({
              where: { id: item.menuItemId },
              data: {
                stockQuantity: { increment: item.quantity },
              },
            });
          }
        }

        // Update customer stats
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalOrders: { decrement: 1 },
            totalSpent: { decrement: order.totalAmount },
          },
        });
      });

      console.log(`✅ Cancelled abandoned order: ${order.orderNumber}`);
    }

    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupPendingOrders();