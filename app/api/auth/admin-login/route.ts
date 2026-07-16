import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const user = await findUserByEmail(email);

    if (!user || user.userType !== 'se7_team') {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
    }

    if (!['se7_admin', 'se7_analyst'].includes(user.role)) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, userType: 'se7_team' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ token, userName: user.name, role: user.role });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Admin login error:', msg);
    return NextResponse.json({ error: 'Erro ao fazer login', debug: msg }, { status: 500 });
  }
}
