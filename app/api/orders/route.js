import { NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { deleted: false },
      include: {
        route: {
          select: {
            id: true,
            distanceKm: true,
            trafficLevel: true,
            baseTimeMin: true
          }
        },
        assignment: {
          where: { deleted: false },
          include: {
            driver: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    const ordersWithStatus = orders.map(order => {
      const estimatedDeliveryTime = order.route ? 
        order.route.baseTimeMin :
        order.deliveryTimeMin;
      
      const isAssigned = !!order.assignment;
      const assignmentStatus = isAssigned ? 'ASSIGNED' : 'UNASSIGNED';
      
      return {
        id: order.id,
        valueRs: order.valueRs,
        deliveryTimeMin: order.deliveryTimeMin,
        estimatedDeliveryTime,
        assignmentStatus,
        isAssigned,
        route: order.route ? {
          id: order.route.id,
          distanceKm: order.route.distanceKm,
          trafficLevel: order.route.trafficLevel,
          baseTimeMin: order.route.baseTimeMin,
          estimatedTimeMin: estimatedDeliveryTime
        } : null,
        assignment: order.assignment ? {
          id: order.assignment.id,
          estimatedTimeMin: order.assignment.estimatedTimeMin,
          assignedAt: order.assignment.assignedAt,
          driver: order.assignment.driver
        } : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });

    const totalOrders = ordersWithStatus.length;
    const assignedOrders = ordersWithStatus.filter(o => o.isAssigned).length;
    const unassignedOrders = totalOrders - assignedOrders;
    const averageValue = totalOrders > 0 ? 
      ordersWithStatus.reduce((sum, o) => sum + o.valueRs, 0) / totalOrders : 0;

    return NextResponse.json({
      success: true,
      data: ordersWithStatus,
      summary: {
        totalOrders,
        assignedOrders,
        unassignedOrders,
        averageValue: Math.round(averageValue * 100) / 100
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch orders'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    const { valueRs, deliveryTimeMin, route, customer, notes } = await request.json();
    
    if (!valueRs || !deliveryTimeMin || !customer?.name || !customer?.address) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: valueRs, deliveryTimeMin, customer name and address'
      }, { status: 400 });
    }

    if (parseFloat(valueRs) <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Order value must be greater than 0'
      }, { status: 400 });
    }

    if (parseInt(deliveryTimeMin) <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Delivery time must be greater than 0'
      }, { status: 400 });
    }

    if (route?.distanceKm && parseFloat(route.distanceKm) <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Distance must be greater than 0'
      }, { status: 400 });
    }

    const distanceKm = route?.distanceKm ? parseFloat(route.distanceKm) : 5.0;
    const trafficLevel = route?.trafficLevel || 'MEDIUM';
    
    const baseTimeMin = Math.ceil((distanceKm / 30) * 60);
    
    const lastRoute = await prisma.route.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextRouteId = (lastRoute?.id || 0) + 1;
    
    const routeRecord = await prisma.route.create({
      data: {
        id: nextRouteId,
        distanceKm: distanceKm,
        trafficLevel: trafficLevel,
        baseTimeMin: baseTimeMin,
        deleted: false
      }
    });

    const lastOrder = await prisma.order.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextOrderId = (lastOrder?.id || 0) + 1;

    const newOrder = await prisma.order.create({
      data: {
        id: nextOrderId,
        valueRs: parseFloat(valueRs),
        deliveryTimeMin: parseInt(deliveryTimeMin),
        routeId: routeRecord.id,
        deleted: false
      },
      include: {
        route: {
          select: {
            id: true,
            distanceKm: true,
            trafficLevel: true,
            baseTimeMin: true
          }
        }
      }
    });

    const estimatedDeliveryTime = newOrder.route ? 
      newOrder.route.baseTimeMin :
      newOrder.deliveryTimeMin;

    const orderResponse = {
      id: newOrder.id,
      valueRs: newOrder.valueRs,
      deliveryTimeMin: newOrder.deliveryTimeMin,
      estimatedDeliveryTime,
      assignmentStatus: 'UNASSIGNED',
      isAssigned: false,
      route: newOrder.route ? {
        id: newOrder.route.id,
        distanceKm: newOrder.route.distanceKm,
        trafficLevel: newOrder.route.trafficLevel,
        baseTimeMin: newOrder.route.baseTimeMin,
        estimatedTimeMin: estimatedDeliveryTime
      } : null,
      assignment: null,

      createdAt: newOrder.createdAt,
      updatedAt: newOrder.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: `Order #${newOrder.id} created successfully`,
      data: orderResponse
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to create order'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}