import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Encontrar usuário da equipe
    const user = await prisma.user.findFirst({
      where: {
        email,
        userType: 'se7_team',
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (!['se7_admin', 'se7_analyst'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        userType: 'se7_team',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        token,
        userName: user.name,
        role: user.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}
