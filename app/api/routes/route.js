import { NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      where: { deleted: false },
      include: {
        _count: {
          select: {
            orders: {
              where: { deleted: false }
            }
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    const routesWithCalculations = routes.map(route => {
      const trafficMultiplier = {
        'LOW': 1.0,
        'MEDIUM': 1.3,
        'HIGH': 1.6
      };
      
      const estimatedTimeMin = Math.ceil(
        route.baseTimeMin * trafficMultiplier[route.trafficLevel]
      );
      
      return {
        id: route.id,
        distanceKm: route.distanceKm,
        trafficLevel: route.trafficLevel,
        baseTimeMin: route.baseTimeMin,
        estimatedTimeMin,
        trafficMultiplier: trafficMultiplier[route.trafficLevel],
        orderCount: route._count.orders,
        createdAt: route.createdAt,
        updatedAt: route.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      data: routesWithCalculations
    });

  } catch (error) {
    console.error('❌ Failed to fetch routes:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch routes',
      message: error.message
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}