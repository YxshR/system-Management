import { NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { deleted: false },
      include: {
        order: {
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
        },
        driver: {
          select: {
            id: true,
            name: true,
            shiftHours: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    const assignmentsWithDetails = assignments.map(assignment => {
      const trafficMultiplier = {
        'LOW': 1.0,
        'MEDIUM': 1.3,
        'HIGH': 1.6
      };
      
      const routeEstimatedTime = assignment.order.route ? 
        Math.ceil(assignment.order.route.baseTimeMin * trafficMultiplier[assignment.order.route.trafficLevel]) :
        assignment.order.deliveryTimeMin;
      
      const estimatedCompletionTime = new Date(
        assignment.assignedAt.getTime() + (assignment.estimatedTimeMin * 60 * 1000)
      );
      
      return {
        id: assignment.id,
        estimatedTimeMin: assignment.estimatedTimeMin,
        assignedAt: assignment.assignedAt,
        estimatedCompletionTime,
        order: {
          id: assignment.order.id,
          valueRs: assignment.order.valueRs,
          deliveryTimeMin: assignment.order.deliveryTimeMin,
          route: assignment.order.route ? {
            id: assignment.order.route.id,
            distanceKm: assignment.order.route.distanceKm,
            trafficLevel: assignment.order.route.trafficLevel,
            baseTimeMin: assignment.order.route.baseTimeMin,
            estimatedTimeMin: routeEstimatedTime
          } : null
        },
        driver: assignment.driver ? {
          id: assignment.driver.id,
          name: assignment.driver.name,
          shiftHours: assignment.driver.shiftHours
        } : null,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt
      };
    });

    const totalAssignments = assignmentsWithDetails.length;
    const totalEstimatedTime = assignmentsWithDetails.reduce(
      (sum, a) => sum + a.estimatedTimeMin, 0
    );
    const averageEstimatedTime = totalAssignments > 0 ? 
      Math.round((totalEstimatedTime / totalAssignments) * 100) / 100 : 0;
    
    const assignmentsByDriver = assignmentsWithDetails.reduce((acc, assignment) => {
      if (assignment.driver) {
        const driverId = assignment.driver.id;
        if (!acc[driverId]) {
          acc[driverId] = {
            driver: assignment.driver,
            assignments: [],
            totalTime: 0
          };
        }
        acc[driverId].assignments.push(assignment);
        acc[driverId].totalTime += assignment.estimatedTimeMin;
      }
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: assignmentsWithDetails,
      summary: {
        totalAssignments,
        totalEstimatedTimeMin: totalEstimatedTime,
        averageEstimatedTimeMin: averageEstimatedTime,
        assignmentsByDriver: Object.values(assignmentsByDriver).map(group => ({
          driver: group.driver,
          assignmentCount: group.assignments.length,
          totalTimeMin: group.totalTime,
          totalTimeHours: Math.round((group.totalTime / 60) * 100) / 100
        }))
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch assignments:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch assignments',
      message: error.message
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    let options = {};
    try {
      const body = await request.json();
      options = body || {};
    } catch (parseError) {
      options = {};
    }

    
    const {
      maxOrdersPerRun = 100,
      dryRun = false,
      forceReassign = false
    } = options;

    if (typeof maxOrdersPerRun !== 'number' || maxOrdersPerRun < 1 || maxOrdersPerRun > 1000) {
      return NextResponse.json({
        success: false,
        error: 'Invalid maxOrdersPerRun parameter',
        message: 'maxOrdersPerRun must be a number between 1 and 1000'
      }, { status: 400 });
    }

    if (typeof dryRun !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Invalid dryRun parameter',
        message: 'dryRun must be a boolean value'
      }, { status: 400 });
    }

    if (typeof forceReassign !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Invalid forceReassign parameter',
        message: 'forceReassign must be a boolean value'
      }, { status: 400 });
    }

    if (!forceReassign && !dryRun) {
      const existingAssignments = await prisma.assignment.count({
        where: { deleted: false }
      });
      
      if (existingAssignments > 0) {
        const unassignedCount = await prisma.order.count({
          where: {
            deleted: false,
            assignment: null
          }
        });
        
        if (unassignedCount === 0) {
          return NextResponse.json({
            success: true,
            message: 'All orders are already assigned',
            assignments: [],
            summary: {
              totalOrdersProcessed: 0,
              totalOrdersAssigned: 0,
              totalOrdersSkipped: 0,
              driversUsed: 0,
              existingAssignments
            }
          });
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const unassignedOrders = await tx.order.findMany({
        where: { 
          deleted: false,
          assignment: null
        },
        include: { route: true },
        take: maxOrdersPerRun,
        orderBy: { id: 'asc' }
      });

      if (unassignedOrders.length === 0) {
        return {
          success: true,
          message: 'No unassigned orders found',
          assignments: [],
          summary: { totalOrdersAssigned: 0, totalOrdersProcessed: 0 }
        };
      }

      const drivers = await tx.driver.findMany({
        where: { deleted: false },
        include: {
          assignments: {
            where: { deleted: false },
            include: { order: true }
          }
        }
      });

      const assignments = [];
      let assignedCount = 0;

      for (const order of unassignedOrders) {
        const availableDriver = drivers
          .map(driver => {
            const currentWorkload = driver.assignments.reduce((sum, assignment) => 
              sum + (assignment.estimatedTimeMin || 0), 0
            );
            const maxWorkload = driver.shiftHours * 60;
            const remainingCapacity = maxWorkload - currentWorkload;
            
            return {
              ...driver,
              currentWorkload,
              remainingCapacity,
              canTakeOrder: remainingCapacity >= order.deliveryTimeMin
            };
          })
          .filter(driver => driver.canTakeOrder)
          .sort((a, b) => a.currentWorkload - b.currentWorkload)[0];

        if (availableDriver && !dryRun) {
          const assignment = await tx.assignment.create({
            data: {
              orderId: order.id,
              driverId: availableDriver.id,
              estimatedTimeMin: order.deliveryTimeMin,
              assignedAt: new Date(),
              deleted: false
            }
          });
          
          assignments.push(assignment);
          assignedCount++;
          
          availableDriver.currentWorkload += order.deliveryTimeMin;
        }
      }

      return {
        success: true,
        message: `Successfully assigned ${assignedCount} orders`,
        assignments,
        summary: {
          totalOrdersAssigned: assignedCount,
          totalOrdersProcessed: unassignedOrders.length
        }
      };
    });

    if (result.success) {
      const responseData = {
        success: true,
        message: result.message,
        dryRun,
        assignments: result.assignments || [],
        skippedOrders: result.skippedOrders || [],
        summary: {
          ...result.summary,
          timestamp: new Date().toISOString(),
          requestOptions: {
            maxOrdersPerRun,
            dryRun,
            forceReassign
          }
        }
      };

      
      if (result.driverWorkloadAfterAssignment) {
        responseData.driverWorkloadAfterAssignment = result.driverWorkloadAfterAssignment;
      }

      return NextResponse.json(responseData);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Assignment algorithm failed',
        message: result.message || 'Unknown error occurred',
        dryRun
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Assignment API endpoint failed:', error);
    
    if (error.message.includes('No available drivers')) {
      return NextResponse.json({
        success: false,
        error: 'No available drivers',
        message: 'No drivers are available for assignment at this time',
        suggestions: [
          'Check if drivers have remaining shift capacity',
          'Verify driver data is properly loaded',
          'Consider adjusting shift hours or workload distribution'
        ]
      }, { status: 422 });
    }

    if (error.message.includes('No unassigned orders')) {
      return NextResponse.json({
        success: true,
        message: 'No unassigned orders to process',
        assignments: [],
        summary: {
          totalOrdersProcessed: 0,
          totalOrdersAssigned: 0,
          totalOrdersSkipped: 0,
          driversUsed: 0
        }
      });
    }

    if (error.message.includes('Database')) {
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Failed to access database during assignment process',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: 'Assignment process failed',
      message: error.message || 'An unexpected error occurred during assignment',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}