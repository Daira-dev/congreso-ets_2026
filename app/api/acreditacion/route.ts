import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID no proporcionado.' }, { status: 400 });
    }

    const registrant = await prisma.registrant.findUnique({
      where: { id }
    });

    if (!registrant) {
      return NextResponse.json({ success: false, message: 'QR inválido / no encontrado.' }, { status: 404 });
    }

    if (registrant.estado !== 'CONFIRMADA') {
      return NextResponse.json({ success: false, message: 'La actividad seleccionada no se encuentra habilitada para registrar asistencia.' }, { status: 403 });
    }

    if (registrant.asistencia) {
      return NextResponse.json({ success: false, message: 'Esta persona ya registra una acreditación de ingreso.' }, { status: 409 });
    }

    await prisma.registrant.update({
      where: { id },
      data: { asistencia: true }
    });

    return NextResponse.json({ success: true, message: 'Asistencia registrada correctamente para esta actividad.', registrant }, { status: 200 });

  } catch (error) {
    console.error('Error en la acreditación:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
  }
}
