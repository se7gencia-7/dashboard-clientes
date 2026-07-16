import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { rpc } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string; clientId: string };
  } catch { return null; }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const decoded = verifyToken(request);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId } = await params;

  const { data, error } = await rpc('get_project_detail', {
    p_project_id: projectId,
    p_client_id:  decoded.clientId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const d = data as {
    project:      Record<string, unknown>;
    campaigns:    Record<string, unknown>[];
    audiences:    Record<string, unknown>[];
    positionings: Record<string, unknown>[];
    creatives:    Record<string, unknown>[];
  };

  const campaigns  = d.campaigns ?? [];
  const totalSpend = campaigns.reduce((s, c) => s + Number(c['budget']      ?? 0), 0);
  const totalReach = campaigns.reduce((s, c) => s + Number(c['totalReach']  ?? 0), 0);
  const totalConv  = campaigns.reduce((s, c) => s + Number(c['conversions'] ?? 0), 0);

  return NextResponse.json({
    project: d.project,
    data: {
      overview:     { totalCampaigns: campaigns.length, totalSpend, totalReach, averageROI: totalConv },
      audiences:    d.audiences    ?? [],
      positionings: d.positionings ?? [],
      creatives:    d.creatives    ?? [],
      campaigns,
    },
  });
}
