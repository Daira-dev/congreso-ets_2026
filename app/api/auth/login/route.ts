import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { usuario, clave } = await req.json();

    const user = await prisma.adminUser.findUnique({
      where: { usuario }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Credenciales inválidas' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(clave, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = await signToken({
      id: user.id,
      usuario: user.usuario,
      rol: user.rol
    });

    const response = NextResponse.json({ success: true, rol: user.rol }, { status: 200 });
    
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
