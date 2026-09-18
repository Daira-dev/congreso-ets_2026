import nodemailer from 'nodemailer';
import { Registrant } from '@prisma/client';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Modo desarrollo: crear cuenta de prueba automáticamente
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  return transporter;
};

export const sendConfirmationEmail = async (registrant: Registrant, qrDataUrl?: string) => {
  const mailTransporter = await getTransporter();
  const htmlConfirmacion = `
    <div style="font-family: Arial, sans-serif; color: #1D3343; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #035C80; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Ministerio de Educación</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Buenos Aires Ciudad</p>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #035C80; margin-top: 0;">¡Inscripción Confirmada!</h2>
        <p>Hola <strong>${registrant.nombre} ${registrant.apellido}</strong>,</p>
        <p>Tu inscripción al <strong>1er Congreso de Educación Técnica Superior – ETS 2026</strong> ha sido confirmada exitosamente.</p>
        <p>A continuación te enviamos tu código QR personal e intransferible. Por favor, preséntalo al ingresar al evento para registrar tu asistencia.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="cid:qrcode" alt="Tu Código QR de Acceso" style="border: 2px solid #1D3343; border-radius: 8px; padding: 10px;" />
        </div>
        
        <p style="font-size: 14px; color: #666;">
          <strong>Datos del evento:</strong><br>
          Fecha: 6 de noviembre de 2026<br>
          Sede: Auditorio Polo Saavedra · Crisólogo Larralde 5085
        </p>
      </div>
      <div style="background-color: #1D3343; padding: 15px; text-align: center; color: white; font-size: 12px;">
        Este es un correo automático, por favor no respondas a esta dirección.<br>
        Consultas institucionales: congreso.dets@bue.edu.ar
      </div>
    </div>
  `;

  const htmlEspera = `
    <div style="font-family: Arial, sans-serif; color: #1D3343; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #035C80; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Ministerio de Educación</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Buenos Aires Ciudad</p>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #035C80; margin-top: 0;">Registro en Lista de Espera</h2>
        <p>Hola <strong>${registrant.nombre} ${registrant.apellido}</strong>,</p>
        <p>El cupo de inscripciones confirmadas para el <strong>1er Congreso de Educación Técnica Superior – ETS 2026</strong> se encuentra completo.</p>
        <p>Tu registro fue incorporado a la lista de espera. Te informaremos ante cualquier cambio de estado o liberación de cupos por este mismo medio.</p>
        <p>Agradecemos tu interés en participar.</p>
      </div>
      <div style="background-color: #1D3343; padding: 15px; text-align: center; color: white; font-size: 12px;">
        Este es un correo automático, por favor no respondas a esta dirección.<br>
        Consultas institucionales: congreso.dets@bue.edu.ar
      </div>
    </div>
  `;

  const attachments = registrant.estado === 'CONFIRMADA' && qrDataUrl ? [
    {
      filename: 'qrcode.png',
      content: qrDataUrl.split("base64,")[1],
      encoding: 'base64',
      cid: 'qrcode'
    }
  ] : [];

  const subject = registrant.estado === 'CONFIRMADA' 
    ? 'Confirmación de Inscripción - Congreso ETS 2026'
    : 'Lista de Espera - Congreso ETS 2026';

  const html = registrant.estado === 'CONFIRMADA' ? htmlConfirmacion : htmlEspera;

  try {
    const info = await mailTransporter.sendMail({
      from: '"Congreso ETS 2026" <congreso.dets@bue.edu.ar>',
      to: registrant.correo,
      subject,
      html,
      attachments
    });
    console.log("Email enviado:", info.messageId);
    
    // Si no hay SMTP_USER, estamos usando Ethereal. Imprimir la URL de previsualización.
    if (!process.env.SMTP_USER) {
      console.log("URL de previsualización del correo: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
};
