import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

export const SESSION_COOKIE_NAME = "congreso_session";

export interface SessionPayload {
  sub: number;
  email: string;
  nombre: string;
  apellido: string;
  rol_id: number;
  rol_nombre: string;
  jerarquia: number;
  exp: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET ?? "";

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET no está configurada.");
}

type PasswordHash = {
  salt: string;
  hash: string;
};

/* Genera un hash compatible con el formato: salt:hash */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return `${salt}:${hash}`;
}

/* Verifica una contraseña contra un hash salt:hash */
export function verifyPassword(
  password: string,
  storedHash: string | null | undefined
): boolean {
  if (!storedHash) {
    return false;
  }

  const parts = storedHash.split(":");

  if (parts.length !== 2) {
    return false;
  }

  const [salt, storedKey] = parts;

  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);

    const storedKeyBuffer = Buffer.from(storedKey, "hex");

    if (derivedKey.length !== storedKeyBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      derivedKey,
      storedKeyBuffer
    );
  } catch {
    return false;
  }
}

/* Firma un token de sesión mediante HMAC-SHA256 */
/* El token contiene: payloadBase64.signature */
export async function signSessionToken(
  payload: Record<string, unknown>,
  expiresInSeconds: number
): Promise<string> {
  const data = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const payloadBase64 = Buffer.from(
    JSON.stringify(data)
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/* Verifica y decodifica un token de sesión */
export function verifySessionToken(
  token: string
): SessionPayload | null {
  try {
    const [payloadBase64, signature] = token.split(".");

    if (!payloadBase64 || !signature) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payloadBase64)
      .digest("base64url");

    if (signature.length !== expectedSignature.length) {
      return null;
    }

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!valid) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf8")
    ) as SessionPayload;

    if (
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}