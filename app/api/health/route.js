import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`;
    
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: { status: 'healthy' }
    });
    
  } catch (error) {
    return Response.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: { status: 'error', error: error.message }
    }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}