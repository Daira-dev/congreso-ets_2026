import QRCode from 'qrcode';

export const generateQR = async (data: string): Promise<string> => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      color: {
        dark: '#1D3343', // Azul Oscuro según Manual Toolkit
        light: '#FFFFFF'
      },
      width: 300,
      margin: 2
    });
    return qrDataUrl;
  } catch (err) {
    console.error('Error generando el código QR', err);
    throw err;
  }
};
