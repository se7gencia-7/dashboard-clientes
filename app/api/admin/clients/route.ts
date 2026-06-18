import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      userType: string;
    };

    if (decoded.userType !== 'se7_team') return null;
    if (!['se7_admin', 'se7_analyst'].includes(decoded.role)) return null;

    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const decoded = verifyAdminToken(request);

  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const clients = await prisma.client.findMany({
      include: {
        projects: true,
        users: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Processar dados dos clientes
    const clientsData = await Promise.all(
      clients.map(async (client) => {
        const campaigns = await prisma.campaign.findMany({
          where: {
            project: {
              clientId: client.id,
            },
          },
          include: { metrics: true },
        });

        const totalSpend = campaigns.reduce((sum, c) => sum + c.budget, 0);
        const totalReach = campaigns.reduce((sum, c) => {
          const reach = c.metrics.reduce((s, m) => s + m.reach, 0);
          return sum + reach;
        }, 0);

        return {
          id: client.id,
          name: client.name,
          email: client.email,
          projectCount: client.projects.length,
          totalSpend,
          totalReach,
          createdAt: client.createdAt,
        };
      })
    );

    // Calcular estatísticas gerais
    const stats = {
      totalClients: clients.length,
      totalProjects: clients.reduce((sum, c) => sum + c.projects.length, 0),
      totalSpend: clientsData.reduce((sum, c) => sum + c.totalSpend, 0),
      totalReach: clientsData.reduce((sum, c) => sum + c.totalReach, 0),
    };

    return NextResponse.json({
      clients: clientsData,
      stats,
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Error fetching clients' },
      { status: 500 }
    );
  }
}
