import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reviewSchema } from '@/validations/review';

// GET /api/reviews - Fetch reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const restaurantId = searchParams.get('restaurantId');
    const menuItemId = searchParams.get('menuItemId');

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID required' },
        { status: 400 }
      );
    }

    const where: any = {
      order: {
        restaurantId,
      },
    };

    if (menuItemId) {
      where.order = {
        ...where.order,
        orderItems: {
          some: {
            menuItemId,
          },
        },
      };
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
            profileImage: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.review.count({ where });

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = reviewSchema.parse(body);

    // Check order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: validated.orderId,
        customerId: session.user.id,
        status: 'DELIVERED',
      },
      include: {
        restaurant: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found or not eligible for review' },
        { status: 404 }
      );
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: { orderId: validated.orderId },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Order already reviewed' },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        orderId: validated.orderId,
        customerId: session.user.id,
        rating: validated.rating,
        comment: validated.comment,
      },
      include: {
        customer: {
          select: {
            name: true,
            profileImage: true,
          },
        },
      },
    });

    // Update order to mark review popup as completed
    await prisma.order.update({
      where: { id: validated.orderId },
      data: { reviewPopupShownCount: 999 },
    });

    // Check if rewards enabled
    const settings = await prisma.setting.findUnique({
      where: {
        restaurantId_key: {
          restaurantId: order.restaurantId,
          key: 'reviewRewardEnabled',
        },
      },
    });

    let promoCode = null;

    if (settings && JSON.parse(settings.value) === true) {
      // Get reward settings
      const rewardTypeSettings = await prisma.setting.findUnique({
        where: {
          restaurantId_key: {
            restaurantId: order.restaurantId,
            key: 'reviewRewardType',
          },
        },
      });

      const rewardValueSettings = await prisma.setting.findUnique({
        where: {
          restaurantId_key: {
            restaurantId: order.restaurantId,
            key: 'reviewRewardValue',
          },
        },
      });

      const rewardExpirySettings = await prisma.setting.findUnique({
        where: {
          restaurantId_key: {
            restaurantId: order.restaurantId,
            key: 'reviewRewardExpiryDays',
          },
        },
      });

      const rewardType = rewardTypeSettings ? JSON.parse(rewardTypeSettings.value) : 'percentage';
      const rewardValue = rewardValueSettings ? JSON.parse(rewardValueSettings.value) : 10;
      const rewardExpiry = rewardExpirySettings ? JSON.parse(rewardExpirySettings.value) : 7;

      // Generate promo code
      const code = `REVIEW-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const validFrom = new Date();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + rewardExpiry);

      promoCode = await prisma.promoCode.create({
        data: {
          code,
          description: `Thank you for your review! ${rewardValue}${rewardType === 'percentage' ? '%' : '$'} off your next order`,
          discountType: rewardType === 'percentage' ? 'PERCENTAGE' : 'FIXED',
          discountValue: rewardValue,
          minOrderValue: 0,
          usageLimit: 1,
          validFrom,
          validUntil,
          isActive: true,
          restaurantId: order.restaurantId,
          isReviewReward: true,
        },
      });

      // Link promo code to review
      await prisma.review.update({
        where: { id: review.id },
        data: { promoCodeId: promoCode.id },
      });
    }

    return NextResponse.json({
      success: true,
      data: review,
      promoCode: promoCode ? {
        code: promoCode.code,
        description: promoCode.description,
        discountValue: promoCode.discountValue,
        discountType: promoCode.discountType,
        validUntil: promoCode.validUntil,
      } : null,
    });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/:id - Delete review (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const staff = await prisma.staff.findUnique({
      where: { email: session.user.email || '' },
      select: { role: true },
    });

    if (!staff || staff.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Review ID required' },
        { status: 400 }
      );
    }

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}