import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [orders, assignments, drivers] = await Promise.all([
      prisma.order.findMany({
        where: { deleted: false },
        include: {
          route: {
            select: {
              baseTimeMin: true,
              trafficLevel: true
            }
          },
          assignment: {
            where: { deleted: false },
            select: { id: true }
          }
        }
      }),
      
      prisma.assignment.findMany({
        where: { deleted: false },
        select: {
          estimatedTimeMin: true,
          assignedAt: true
        }
      }),
      
      prisma.driver.findMany({
        where: { deleted: false },
        select: {
          shiftHours: true,
          pastWeek: true
        }
      })
    ]);

    const totalOrders = orders.length;
    
    const assignedOrders = orders.filter(order => order.assignment).length;
    const pendingAssignments = totalOrders - assignedOrders;
    
    let averageDeliveryTime = 0;
    if (orders.length > 0) {
      const trafficMultiplier = {
        'LOW': 1.0,
        'MEDIUM': 1.3,
        'HIGH': 1.6
      };
      
      const totalDeliveryTime = orders.reduce((sum, order) => {
        if (order.route) {
          return sum + Math.ceil(order.route.baseTimeMin * trafficMultiplier[order.route.trafficLevel]);
        }
        return sum + (order.deliveryTimeMin || 0);
      }, 0);
      
      averageDeliveryTime = Math.round((totalDeliveryTime / orders.length) * 100) / 100;
    }
    
    const totalAssignments = assignments.length;
    const assignmentRate = totalOrders > 0 ? Math.round((assignedOrders / totalOrders) * 100) : 0;
    
    let averageDriverWorkload = 0;
    if (drivers.length > 0) {
      const totalWorkload = drivers.reduce((sum, driver) => {
        const pastWeekHours = driver.pastWeek ? 
          driver.pastWeek.split('|').map(h => parseInt(h) || 0) : 
          [0, 0, 0, 0, 0, 0, 0];
        return sum + pastWeekHours.reduce((weekSum, hours) => weekSum + hours, 0);
      }, 0);
      
      averageDriverWorkload = Math.round((totalWorkload / drivers.length) * 100) / 100;
    }

    const stats = {
      totalOrders,
      pendingAssignments,
      averageDeliveryTime,
      assignmentRate,
      totalAssignments,
      totalDrivers: drivers.length,
      averageDriverWorkload,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Failed to fetch dashboard statistics:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}