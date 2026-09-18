import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

async function isSuperAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload?.rol === 'SUPER_ADMIN';
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const user = await prisma.adminUser.findUnique({ where: { id } });

    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    if (user.usuario === 'superadmin') return NextResponse.json({ error: 'No se puede eliminar al SuperAdmin principal' }, { status: 400 });

    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
