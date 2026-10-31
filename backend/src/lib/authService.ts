import crypto from 'crypto';

export interface SessionPayload {
  sub: number; // operador id
  email: string;
  nombre: string;
  apellido: string;
  rol_id: number;
  rol_nombre: string;
  jerarquia: number;
  permisos?: string[];
  exp: number; // timestamp in seconds
}

export const SESSION_COOKIE_NAME = 'congreso_session';

/**
 * Obtiene la clave de firma verificando que esté configurada en el entorno (Blindaje SEC-05)
 */
function getSecretKeyHex(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      'FATAL DE SEGURIDAD: La variable de entorno ENCRYPTION_KEY es obligatoria y debe contener exactamente 32 bytes en formato hexadecimal (64 caracteres).'
    );
  }
  return key;
}

/**
 * Genera un hash criptográfico seguro para contraseñas usando scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifica si una contraseña coincide con el hash almacenado
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, keyHex] = storedHash.split(':');
    const storedBuffer = Buffer.from(keyHex, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(storedBuffer, derivedKey);
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    return false;
  }
}

/**
 * Obtiene la clave CryptoKey para Web Crypto API (compatible con Node.js y Edge Runtime)
 */
async function getCryptoSubtleKey(): Promise<any> {
  const subtle = globalThis.crypto?.subtle || crypto.webcrypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API subtle no está disponible en este entorno');
  }
  const encoder = new TextEncoder();
  return subtle.importKey(
    'raw',
    encoder.encode(getSecretKeyHex()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Firma un token de sesión seguro compatible con Edge Runtime y Node
 */
export async function signSessionToken(
  payload: Omit<SessionPayload, 'exp'>,
  expiresInSeconds: number = 60 * 60 * 24 * 7 // 7 días
): Promise<string> {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const dataToSign = `${headerB64}.${payloadB64}`;

  const subtle = globalThis.crypto?.subtle || crypto.webcrypto?.subtle;
  const key = await getCryptoSubtleKey();
  const encoder = new TextEncoder();
  const signature = await subtle.sign('HMAC', key, encoder.encode(dataToSign));
  const signatureB64 = Buffer.from(signature).toString('base64url');

  return `${dataToSign}.${signatureB64}`;
}

/**
 * Verifica y decodifica un token de sesión
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToVerify = `${headerB64}.${payloadB64}`;

    const subtle = globalThis.crypto?.subtle || crypto.webcrypto?.subtle;
    const key = await getCryptoSubtleKey();
    const encoder = new TextEncoder();

    const signatureBytes = Buffer.from(signatureB64, 'base64url');
    const isValid = await subtle.verify('HMAC', key, signatureBytes, encoder.encode(dataToVerify));

    if (!isValid) return null;

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(payloadJson);

    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Token expirado
    }

    return payload;
  } catch (error) {
    return null;
  }
}
