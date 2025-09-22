import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { orderId, driverId } = await request.json();
    
    if (!orderId || !driverId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID and Driver ID are required'
      }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: parseInt(orderId),
        deleted: false 
      },
      include: {
        route: true
      }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    const driver = await prisma.driver.findFirst({
      where: { 
        OR: [
          { id: parseInt(driverId) },
          { name: driverId }
        ],
        deleted: false 
      }
    });

    if (!driver) {
      return NextResponse.json({
        success: false,
        message: 'Driver not found'
      }, { status: 404 });
    }

    const existingAssignment = await prisma.assignment.findFirst({
      where: { 
        orderId: parseInt(orderId),
        deleted: false 
      }
    });

    if (existingAssignment) {
      return NextResponse.json({
        success: false,
        message: 'Order is already assigned'
      }, { status: 400 });
    }

    const driverAssignments = await prisma.assignment.findMany({
      where: { 
        driverId: driver.id,
        deleted: false 
      },
      include: {
        order: true
      }
    });

    const currentWorkload = driverAssignments.reduce((sum, assignment) => {
      return sum + (assignment.estimatedTimeMin || assignment.order.deliveryTimeMin || 0);
    }, 0);

    const shiftHours = driver.shiftHours || 8;
    const maxWorkloadMinutes = shiftHours * 60;
    const orderDeliveryTime = order.deliveryTimeMin || 0;

    if (currentWorkload + orderDeliveryTime > maxWorkloadMinutes) {
      return NextResponse.json({
        success: false,
        message: `Driver ${driver.name} doesn't have enough capacity. Current: ${Math.round(currentWorkload)}min, Available: ${Math.round(maxWorkloadMinutes - currentWorkload)}min, Required: ${orderDeliveryTime}min`
      }, { status: 400 });
    }

    const trafficMultiplier = {
      'LOW': 1.0,
      'MEDIUM': 1.3,
      'HIGH': 1.6
    };
    
    const estimatedTimeMin = order.route ? 
      Math.ceil(order.route.baseTimeMin * trafficMultiplier[order.route.trafficLevel]) :
      order.deliveryTimeMin;

    const newAssignment = await prisma.assignment.create({
      data: {
        orderId: order.id,
        driverId: driver.id,
        estimatedTimeMin: estimatedTimeMin,
        assignedAt: new Date(),
        deleted: false
      },
      include: {
        order: {
          include: {
            route: true
          }
        },
        driver: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `Order #${orderId} successfully assigned to ${driver.name}`,
      data: newAssignment
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Internal server error during manual assignment'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}