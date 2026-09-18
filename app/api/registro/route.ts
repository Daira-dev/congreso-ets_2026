import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateQR } from '@/lib/qr';
import { sendConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const existing = await prisma.registrant.findFirst({
      where: {
        OR: [
          { correo: data.correo },
          { numeroDocumento: data.numeroDocumento }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ success: false, message: 'Ya existe un registro con este correo o documento.' }, { status: 400 });
    }

    const confirmedCount = await prisma.registrant.count({
      where: { estado: 'CONFIRMADA' }
    });

    const estado = confirmedCount >= 400 ? 'LISTA_ESPERA' : 'CONFIRMADA';

    const registrant = await prisma.registrant.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento,
        correo: data.correo,
        telefono: data.telefono,
        institucion: data.institucion,
        rolPrincipal: data.rolPrincipal,
        rolAdicional: data.rolAdicional || null,
        intereses: data.intereses || '',
        estado: estado,
      }
    });

    if (estado === 'CONFIRMADA') {
      const qrDataUrl = await generateQR(registrant.id);
      await sendConfirmationEmail(registrant, qrDataUrl);
    } else {
      await sendConfirmationEmail(registrant);
    }

    return NextResponse.json({ success: true, estado, registrant }, { status: 201 });
  } catch (error) {
    console.error('Error en el registro:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
  }
}
