import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'my-restaurant' },
    update: {},
    create: {
      name: 'My Restaurant',
      slug: 'my-restaurant',
      email: 'info@myrestaurant.com',
      phone: '+1234567890',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      description: 'A wonderful restaurant',
      timezone: 'America/New_York',
      currency: 'USD',
      primaryColor: '#0ea5e9',
      secondaryColor: '#f5f5f5',
      accentColor: '#ef4444',
      pageBgColor: '#f5f5f5',
      bodyColor: '#ffffff',
      bodyTextColor: '#171717',
      footerBgColor: '#171717',
      footerTextColor: '#fafafa',
      fontFamily: 'Inter',
      taxRate: 8.5,
      serviceFee: 2.0,
      minOrderValue: 10.0,
      enableDineIn: true,
      enablePickup: true,
      enableDelivery: true,
      enableGuestCheckout: true,
      autoConfirmBookings: false,
      bookingDepositAmount: 0,
      isActive: true,
    },
  });

  console.log('✅ Restaurant created:', restaurant.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.staff.upsert({
    where: { email: 'admin@myrestaurant.com' },
    update: {},
    create: {
      email: 'admin@myrestaurant.com',
      name: 'Admin User',
      phone: '+1234567890',
      role: 'ADMIN',
      passwordHash: hashedPassword,
      isActive: true,
      restaurantId: restaurant.id,
    },
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('   Password: admin123');

  // Create sample categories
  const appetizers = await prisma.category.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: 'Appetizers',
      },
    },
    update: {},
    create: {
      name: 'Appetizers',
      description: 'Start your meal right',
      sortOrder: 1,
      isActive: true,
      restaurantId: restaurant.id,
    },
  });

  const mainCourse = await prisma.category.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: 'Main Course',
      },
    },
    update: {},
    create: {
      name: 'Main Course',
      description: 'Hearty main dishes',
      sortOrder: 2,
      isActive: true,
      restaurantId: restaurant.id,
    },
  });

  console.log('✅ Categories created');

  // Create sample menu items
  const existingPizza = await prisma.menuItem.findFirst({
    where: {
      restaurantId: restaurant.id,
      name: 'Margherita Pizza',
    },
  });

  const pizza = existingPizza || await prisma.menuItem.create({
    data: {
      name: 'Margherita Pizza',
      description: 'Classic pizza with fresh mozzarella',
      price: 12.99,
      isAvailable: true,
      isVegetarian: true,
      categoryId: mainCourse.id,
      restaurantId: restaurant.id,
    },
  });

  const existingPasta = await prisma.menuItem.findFirst({
    where: {
      restaurantId: restaurant.id,
      name: 'Spaghetti Carbonara',
    },
  });

  const pasta = existingPasta || await prisma.menuItem.create({
    data: {
      name: 'Spaghetti Carbonara',
      description: 'Creamy pasta with bacon',
      price: 14.99,
      isAvailable: true,
      categoryId: mainCourse.id,
      restaurantId: restaurant.id,
    },
  });

  console.log('✅ Menu items created');

  // Create sample customer
  const customer = await prisma.customer.upsert({
    where: {
      email: 'customer@example.com',
    },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'John Doe',
      phone: '+1234567890',
      isGuest: false,
      restaurantId: restaurant.id,
    },
  });

  console.log('✅ Customer created');

  // Create sample DELIVERED orders (for AI forecasting to work)
  const ordersToCreate = [];
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(i / 2); // 2 orders per day for last 7 days
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysAgo);
    
    ordersToCreate.push({
      orderNumber: `ORD-${Date.now()}-${i}`,
      type: ['DINE_IN', 'PICKUP', 'DELIVERY'][i % 3] as any,
      status: 'DELIVERED' as any,
      customerId: customer.id,
      restaurantId: restaurant.id,
      subtotal: 25 + (i * 5),
      taxAmount: 2.5,
      serviceFee: 2.0,
      tipAmount: 3.0,
      discountAmount: 0,
      totalAmount: 32.5 + (i * 5),
      paymentMethod: 'CASH' as any,
      paymentStatus: 'COMPLETED' as any,
      createdAt: orderDate,
      updatedAt: orderDate,
    });
  }

  // Bulk create orders
  await prisma.order.createMany({
    data: ordersToCreate,
  });

  // Create order items for each order
  const orders = await prisma.order.findMany({
    where: { restaurantId: restaurant.id },
  });

  for (const order of orders) {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        menuItemId: pizza.id,
        name: pizza.name,
        price: pizza.price,
        quantity: 2,
      },
    });
  }

  console.log(`✅ Created ${orders.length} sample DELIVERED orders with items`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Database now has real data for AI forecasting and dashboard metrics');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });