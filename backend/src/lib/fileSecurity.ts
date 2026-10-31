/**
 * Utilidades de sanitización y verificación de integridad de archivos subidos (SEC-09)
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedBuffer?: Buffer;
}

/**
 * Verifica magic bytes para formatos de imagen y documentos admitidos
 */
export function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  const hex4 = buffer.slice(0, 4).toString('hex').toLowerCase();
  const hex3 = buffer.slice(0, 3).toString('hex').toLowerCase();

  switch (ext.toLowerCase()) {
    case '.png':
      return hex4 === '89504e47'; // \x89PNG
    case '.jpg':
    case '.jpeg':
      return hex3 === 'ffd8ff'; // SOI
    case '.webp':
      return buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
    case '.pdf':
      return buffer.slice(0, 4).toString('ascii') === '%PDF';
    case '.avif':
      return buffer.length >= 12 && buffer.slice(4, 8).toString('ascii') === 'ftyp';
    case '.svg':
      return isWellFormedSvg(buffer);
    default:
      return false;
  }
}

/**
 * Comprueba si un buffer corresponde a un archivo SVG XML válido
 */
function isWellFormedSvg(buffer: Buffer): boolean {
  try {
    const text = buffer.toString('utf8').trim().toLowerCase();
    return (
      (text.startsWith('<svg') || text.startsWith('<?xml') || text.startsWith('<!doctype svg')) &&
      text.includes('</svg>')
    );
  } catch {
    return false;
  }
}

/**
 * Sanitiza un archivo SVG eliminando scripts, eventos y etiquetas activas (Stored XSS prevention)
 */
export function sanitizeSvg(buffer: Buffer): ValidationResult {
  try {
    let svgContent = buffer.toString('utf8');

    // Patrones de código ejecutable no permitidos en archivos SVG
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi,
      /\bon[a-z]+\s*=\s*(['"]).*?\1/gi, // onload, onerror, onclick, etc.
      /\bon[a-z]+\s*=\s*[^>\s]+/gi,
      /href\s*=\s*(['"])\s*javascript:.*?\1/gi,
      /xlink:href\s*=\s*(['"])\s*javascript:.*?\1/gi,
    ];

    let hasExecutableContent = false;
    for (const pattern of dangerousPatterns) {
      if (pattern.test(svgContent)) {
        hasExecutableContent = true;
        svgContent = svgContent.replace(pattern, '');
      }
    }

    if (hasExecutableContent) {
      console.warn('[SECURITY] Se detectó y purgó contenido de script/evento en un archivo SVG.');
    }

    return {
      valid: true,
      sanitizedBuffer: Buffer.from(svgContent, 'utf8'),
    };
  } catch (err: any) {
    return {
      valid: false,
      error: 'Error al sanitizar archivo vectorial SVG.',
    };
  }
}
