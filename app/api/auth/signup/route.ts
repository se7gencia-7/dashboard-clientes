import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { clientName, email, password, userName } = await request.json();

    if (!clientName || !email || !password || !userName) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar cliente
    const client = await prisma.client.create({
      data: {
        name: clientName,
        email: email,
      },
    });

    // Criar usuário admin
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: userName,
        role: 'admin',
        clientId: client.id,
      },
    });

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        clientId: client.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        token,
        clientId: client.id,
        message: 'Conta criada com sucesso!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
