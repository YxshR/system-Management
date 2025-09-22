import { NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';
import path from 'path';
import fs from 'fs';
import csvParser from 'csv-parser';

const prisma = new PrismaClient();

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      reject(new Error(`CSV file not found: ${fullPath}`));
      return;
    }
    fs.createReadStream(fullPath)
      .pipe(csvParser({
        skipEmptyLines: true,
        trim: true
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(new Error(`CSV parsing failed: ${error.message}`)));
  });
}

function validateDriverData(rawData) {
  const validatedData = [];
  const errors = [];

  rawData.forEach((row, index) => {
    try {
      if (!row.name || !row.shift_hours || !row.past_week_hours) {
        errors.push(`Row ${index + 1}: Missing required fields`);
        return;
      }

      const shiftHours = parseFloat(row.shift_hours);
      if (isNaN(shiftHours) || shiftHours <= 0 || shiftHours > 24) {
        errors.push(`Row ${index + 1}: Invalid shift_hours value`);
        return;
      }

      const pastWeekHours = row.past_week_hours.split('|').map(h => parseFloat(h.trim()));
      
      if (pastWeekHours.length !== 7) {
        errors.push(`Row ${index + 1}: past_week_hours must contain exactly 7 values`);
        return;
      }
      
      if (pastWeekHours.some(h => isNaN(h) || h < 0 || h > 24)) {
        errors.push(`Row ${index + 1}: Invalid past_week_hours values`);
        return;
      }

      validatedData.push({
        name: row.name.trim(),
        shiftHours: shiftHours,
        pastWeek: JSON.stringify(pastWeekHours)
      });
      
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error.message}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Driver data validation errors:\n${errors.join('\n')}`);
  }

  return validatedData;
}

function validateRouteData(rawData) {
  const validatedData = [];
  const errors = [];
  const validTrafficLevels = ['LOW', 'MEDIUM', 'HIGH'];

  rawData.forEach((row, index) => {
    try {
      if (!row.route_id || !row.distance_km || !row.traffic_level || !row.base_time_min) {
        errors.push(`Row ${index + 1}: Missing required fields`);
        return;
      }

      const routeId = parseInt(row.route_id);
      if (isNaN(routeId) || routeId <= 0) {
        errors.push(`Row ${index + 1}: Invalid route_id value`);
        return;
      }

      const distanceKm = parseFloat(row.distance_km);
      if (isNaN(distanceKm) || distanceKm <= 0) {
        errors.push(`Row ${index + 1}: Invalid distance_km value`);
        return;
      }

      const trafficLevel = row.traffic_level.toUpperCase().trim();
      if (!validTrafficLevels.includes(trafficLevel)) {
        errors.push(`Row ${index + 1}: Invalid traffic_level (must be LOW, MEDIUM, or HIGH)`);
        return;
      }

      const baseTimeMin = parseInt(row.base_time_min);
      if (isNaN(baseTimeMin) || baseTimeMin <= 0) {
        errors.push(`Row ${index + 1}: Invalid base_time_min value`);
        return;
      }

      validatedData.push({
        id: routeId,
        distanceKm: distanceKm,
        trafficLevel: trafficLevel,
        baseTimeMin: baseTimeMin
      });
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error.message}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Route data validation errors:\n${errors.join('\n')}`);
  }

  return validatedData;
}

function validateOrderData(rawData) {
  const validatedData = [];
  const errors = [];

  rawData.forEach((row, index) => {
    try {
      if (!row.order_id || !row.value_rs || !row.route_id || !row.delivery_time) {
        errors.push(`Row ${index + 1}: Missing required fields`);
        return;
      }

      const orderId = parseInt(row.order_id);
      if (isNaN(orderId) || orderId <= 0) {
        errors.push(`Row ${index + 1}: Invalid order_id value`);
        return;
      }

      const valueRs = parseFloat(row.value_rs);
      if (isNaN(valueRs) || valueRs < 0) {
        errors.push(`Row ${index + 1}: Invalid value_rs value`);
        return;
      }

      const routeId = parseInt(row.route_id);
      if (isNaN(routeId) || routeId <= 0) {
        errors.push(`Row ${index + 1}: Invalid route_id value`);
        return;
      }

      const deliveryTimeMatch = row.delivery_time.match(/^(\d{1,2}):(\d{2})$/);
      if (!deliveryTimeMatch) {
        errors.push(`Row ${index + 1}: Invalid delivery_time format (should be HH:MM)`);
        return;
      }

      const hours = parseInt(deliveryTimeMatch[1]);
      const minutes = parseInt(deliveryTimeMatch[2]);
      const deliveryTimeMin = hours * 60 + minutes;

      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        errors.push(`Row ${index + 1}: Invalid delivery_time values`);
        return;
      }

      validatedData.push({
        id: orderId,
        valueRs: valueRs,
        routeId: routeId,
        deliveryTimeMin: deliveryTimeMin
      });
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error.message}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Order data validation errors:\n${errors.join('\n')}`);
  }

  return validatedData;
}

export async function POST(request) {
  try {
    console.log('🌱 Starting database seeding via API...');

    console.log('🧹 Clearing existing data...');
    await prisma.assignment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.route.deleteMany();
    await prisma.driver.deleteMany();

    console.log('📍 Seeding routes...');
    const rawRouteData = await parseCSV(path.join(process.cwd(), 'files', 'routes.csv'));
    const validatedRoutes = validateRouteData(rawRouteData);
    
    const createdRoutes = [];
    for (const route of validatedRoutes) {
      const created = await prisma.route.create({
        data: route
      });
      createdRoutes.push(created);
    }

    console.log('🚗 Seeding drivers...');
    const rawDriverData = await parseCSV(path.join(process.cwd(), 'files', 'drivers.csv'));
    const validatedDrivers = validateDriverData(rawDriverData);
    
    const createdDrivers = [];
    for (const driver of validatedDrivers) {
      const created = await prisma.driver.create({
        data: driver
      });
      createdDrivers.push(created);
    }

    console.log('📦 Seeding orders...');
    const rawOrderData = await parseCSV(path.join(process.cwd(), 'files', 'orders.csv'));
    const validatedOrders = validateOrderData(rawOrderData);
    
    const existingRouteIds = await prisma.route.findMany({
      select: { id: true }
    });
    const existingRouteIdSet = new Set(existingRouteIds.map(r => r.id));
    
    const ordersWithValidRoutes = validatedOrders.filter(order => {
      if (!existingRouteIdSet.has(order.routeId)) {
        console.warn(`⚠️  Skipping order ${order.id}: route ${order.routeId} does not exist`);
        return false;
      }
      return true;
    });
    
    const createdOrders = [];
    for (const order of ordersWithValidRoutes) {
      const created = await prisma.order.create({
        data: order
      });
      createdOrders.push(created);
    }

    const driverCount = await prisma.driver.count();
    const routeCount = await prisma.route.count();
    const orderCount = await prisma.order.count();

    console.log('🎉 Database seeding completed successfully via API!');

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        drivers: driverCount,
        routes: routeCount,
        orders: orderCount
      }
    });

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    const driverCount = await prisma.driver.count();
    const routeCount = await prisma.route.count();
    const orderCount = await prisma.order.count();
    const assignmentCount = await prisma.assignment.count();

    return NextResponse.json({
      success: true,
      data: {
        drivers: driverCount,
        routes: routeCount,
        orders: orderCount,
        assignments: assignmentCount
      }
    });

  } catch (error) {
    console.error('❌ Failed to get database status:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}