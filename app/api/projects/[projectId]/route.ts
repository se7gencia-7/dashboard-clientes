import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      clientId: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const decoded = verifyToken(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true },
    });

    if (!project || project.clientId !== decoded.clientId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Buscar dados relacionados
    const [campaigns, audiences, positionings, creatives] = await Promise.all([
      prisma.campaign.findMany({
        where: { projectId },
        include: { metrics: true },
      }),
      prisma.audience.findMany({
        where: { projectId },
      }),
      prisma.positioning.findMany({
        where: { projectId },
      }),
      prisma.creative.findMany({
        where: { projectId },
      }),
    ]);

    // Calcular métricas
    const totalSpend = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalReach = campaigns.reduce((sum, c) => {
      const reach = c.metrics.reduce((s, m) => s + m.reach, 0);
      return sum + reach;
    }, 0);
    const totalConversions = campaigns.reduce((sum, c) => {
      const conv = c.metrics.reduce((s, m) => s + m.conversions, 0);
      return sum + conv;
    }, 0);
    const averageROI =
      totalSpend > 0
        ? ((totalConversions * 100) / campaigns.length) || 0
        : 0;

    return NextResponse.json({
      project,
      data: {
        overview: {
          totalCampaigns: campaigns.length,
          totalSpend,
          totalReach,
          averageROI,
        },
        audiences,
        positionings,
        creatives,
        campaigns,
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Error fetching project' },
      { status: 500 }
    );
  }
}
