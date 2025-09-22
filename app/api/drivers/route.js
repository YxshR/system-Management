import { NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      where: { deleted: false },
      include: {
        assignments: {
          where: { deleted: false },
          include: {
            order: {
              include: {
                route: true
              }
            }
          }
        }
      }
    });

    const driversWithWorkload = drivers.map(driver => {
      let pastWeekHours = [0, 0, 0, 0, 0, 0, 0];
      if (driver.pastWeek) {
        try {
          pastWeekHours = JSON.parse(driver.pastWeek);
        } catch {
          pastWeekHours = driver.pastWeek.split('|').map(h => parseInt(h) || 0);
        }
      }
      
      const totalPastWeekHours = pastWeekHours.reduce((sum, hours) => sum + hours, 0);
      
      const currentDayWorkload = driver.assignments.reduce((total, assignment) => {
        return total + (assignment.estimatedTimeMin || 0);
      }, 0);
      
      const currentDayHours = Math.round((currentDayWorkload / 60) * 100) / 100;
      const remainingShiftHours = Math.max(0, driver.shiftHours - currentDayHours);
      
      return {
        id: driver.id,
        name: driver.name,
        shiftHours: driver.shiftHours,
        pastWeekHours,
        totalPastWeekHours,
        currentDayHours,
        remainingShiftHours,
        assignmentCount: driver.assignments.length,
        workloadPercentage: Math.round((currentDayHours / driver.shiftHours) * 100),
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      data: driversWithWorkload
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch drivers'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    const { name, shiftHours, pastWeekHours } = await request.json();
    
    if (!name || !shiftHours) {
      return NextResponse.json({
        success: false,
        message: 'Driver name and shift hours are required'
      }, { status: 400 });
    }

    if (shiftHours <= 0 || shiftHours > 24) {
      return NextResponse.json({
        success: false,
        message: 'Shift hours must be between 0 and 24'
      }, { status: 400 });
    }

    if (pastWeekHours && pastWeekHours.some(h => h < 0 || h > 24)) {
      return NextResponse.json({
        success: false,
        message: 'All past week hours must be between 0 and 24'
      }, { status: 400 });
    }

    const newDriver = await prisma.driver.create({
      data: {
        name: name.trim(),
        shiftHours: parseFloat(shiftHours),
        pastWeek: JSON.stringify(pastWeekHours || [0, 0, 0, 0, 0, 0, 0]),
        deleted: false
      }
    });

    return NextResponse.json({
      success: true,
      message: `Driver ${name} created successfully`,
      data: newDriver
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to create driver'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}