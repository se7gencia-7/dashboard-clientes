import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { rpc } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string; clientId: string; email: string };
  } catch { return null; }
}

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export async function GET(request: NextRequest) {
  const decoded = verifyToken(request);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await rpc('get_client_projects', { p_client_id: decoded.clientId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const decoded = verifyToken(request);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description } = await request.json();
  if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });

  const { data, error } = await rpc('create_project', {
    p_id: cuid(), p_name: name, p_description: description ?? null, p_client_id: decoded.clientId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
