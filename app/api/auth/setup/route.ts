import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { se7TeamExists, createUser } from '@/lib/db';

export async function POST() {
  try {
    const exists = await se7TeamExists();
    if (exists) {
      return NextResponse.json({ message: 'Admin já existe' });
    }

    const hashed = await bcrypt.hash('Se7Gencia@2026', 10);
    const user = await createUser({
      id: 'cuid_se7admin_001',
      email: 'se7.gencia@gmail.com',
      password: hashed,
      name: 'Samuel',
      role: 'se7_admin',
      userType: 'se7_team',
    });

    return NextResponse.json({ ok: true, email: user.email });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Erro no setup' }, { status: 500 });
  }
}
