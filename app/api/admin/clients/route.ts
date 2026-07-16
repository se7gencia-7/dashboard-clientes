import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { rpc } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string; role: string; userType: string };
    if (decoded.userType !== 'se7_team') return null;
    if (!['se7_admin', 'se7_analyst'].includes(decoded.role)) return null;
    return decoded;
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const decoded = verifyAdminToken(request);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await rpc('get_admin_clients');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const clients = (data as Record<string, unknown>[]) ?? [];
  const stats = {
    totalClients:  clients.length,
    totalProjects: clients.reduce((s, c) => s + Number(c['projectCount'] ?? 0), 0),
  };

  return NextResponse.json({ clients, stats });
}
