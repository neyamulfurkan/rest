import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get settings
    const restaurant = await prisma.restaurant.findFirst({
      where: { isActive: true },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const maxShows = await prisma.setting.findUnique({
      where: {
        restaurantId_key: {
          restaurantId: restaurant.id,
          key: 'reviewPopupMaxShows',
        },
      },
    });

    const daysWindow = await prisma.setting.findUnique({
      where: {
        restaurantId_key: {
          restaurantId: restaurant.id,
          key: 'reviewPopupDaysWindow',
        },
      },
    });

    const reviewsEnabled = await prisma.setting.findUnique({
      where: {
        restaurantId_key: {
          restaurantId: restaurant.id,
          key: 'reviewsEnabled',
        },
      },
    });

    if (reviewsEnabled && JSON.parse(reviewsEnabled.value) === false) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const maxShowsValue = maxShows ? JSON.parse(maxShows.value) : 2;
    const daysWindowValue = daysWindow ? JSON.parse(daysWindow.value) : 7;

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysWindowValue);

    // Find eligible order
    const order = await prisma.order.findFirst({
      where: {
        customerId: session.user.id,
        status: 'DELIVERED',
        actualDeliveryTime: {
          gte: dateThreshold,
        },
        reviewPopupShownCount: {
          lt: maxShowsValue,
        },
        review: null,
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        actualDeliveryTime: 'desc',
      },
    });

    if (order) {
      // Increment popup shown count
      await prisma.order.update({
        where: { id: order.id },
        data: {
          reviewPopupShownCount: {
            increment: 1,
          },
          reviewPopupLastShown: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Fetch unreviewed order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch unreviewed order' },
      { status: 500 }
    );
  }
}