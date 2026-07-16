import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rpc, userExists } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const { clientName, email, password, userName } = await request.json();

    if (!clientName || !email || !password || !userName) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    if (await userExists(email)) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const clientId = cuid();
    const userId   = cuid();

    const { data, error } = await rpc('create_client_and_user', {
      p_client_id:     clientId,
      p_client_name:   clientName,
      p_client_email:  email,
      p_user_id:       userId,
      p_user_email:    email,
      p_user_password: hashedPassword,
      p_user_name:     userName,
    });

    if (error) throw new Error(error.message);

    const token = jwt.sign(
      { userId: (data as { userId: string }).userId, clientId, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ token, clientId, message: 'Conta criada com sucesso!' }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Signup error:', msg);
    return NextResponse.json({ error: 'Erro ao criar conta', debug: msg }, { status: 500 });
  }
}
