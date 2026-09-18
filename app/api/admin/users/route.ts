import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';

async function isSuperAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.rol === 'SUPER_ADMIN';
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const users = await prisma.adminUser.findMany({
      select: { id: true, usuario: true, rol: true, createdAt: true }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const { usuario, clave, rol } = await req.json();

    if (!usuario || !clave || !rol) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const existingUser = await prisma.adminUser.findUnique({ where: { usuario } });
    if (existingUser) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(clave, 10);
    const newUser = await prisma.adminUser.create({
      data: { usuario, passwordHash, rol }
    });

    return NextResponse.json({ id: newUser.id, usuario: newUser.usuario, rol: newUser.rol }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
