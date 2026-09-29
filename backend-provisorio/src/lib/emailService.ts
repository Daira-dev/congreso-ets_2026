import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

async function createTestTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, 
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

export async function enviarCredencialPorEmail(email: string, nombre: string, dni: string, qrToken: string) {
  if (!transporter) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      transporter = await createTestTransporter();
    }
  }

  const urlCredencial = `http://localhost:3000/mi-credencial?dni=${dni}`;

  const info = await transporter.sendMail({
    from: `"Congreso ETS 2026" <${process.env.SMTP_USER || 'noreply@congresoets.com'}>`,
    to: email,
    subject: "Tu Credencial Oficial - Congreso ETS 2026",
    text: `Hola ${nombre}, tu credencial oficial ha sido generada.\n\nPodés acceder y guardarla en tu celular ingresando al siguiente enlace: ${urlCredencial}\n\nTu token de acceso es: ${qrToken}\n\nTe esperamos en el Congreso ETS 2026!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #005691; text-align: center;">Congreso ETS 2026</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Tu credencial oficial ha sido generada exitosamente. Podés acceder a ella y guardarla en tu dispositivo móvil para tenerla lista el día del evento, incluso sin conexión a internet.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${urlCredencial}" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Ver mi Credencial Digital</a>
        </div>
        <p style="font-size: 14px; color: #555;">Si el botón no funciona, podés copiar y pegar este enlace en tu navegador:</p>
        <p style="font-size: 14px; word-break: break-all;"><a href="${urlCredencial}">${urlCredencial}</a></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">Este es un mensaje automático. Por favor, no respondas a este correo.</p>
      </div>
    `,
  });

  console.log("-----------------------------------------");
  console.log("Email enviado a:", email);
  console.log("URL de previsualización Ethereal:", nodemailer.getTestMessageUrl(info));
  console.log("-----------------------------------------");
  
  return info;
}
