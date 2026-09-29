import { Request, Response, NextFunction } from "express";
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
  SessionPayload,
} from "../lib/authService";

export interface AuthenticatedRequest extends Request {
  operator?: SessionPayload;
}

/**
 * Extrae el operador desde:
 * 1. Authorization: Bearer <token>
 * 2. Cookie de sesión
 */
export async function authenticateOperator(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token && req.cookies?.[SESSION_COOKIE_NAME]) {
      token = req.cookies[SESSION_COOKIE_NAME];
    }

    if (token) {
      const payload = verifySessionToken(token);

      if (payload) {
        req.operator = payload;
      }
    }

    next();
  } catch {
    next();
  }
}

/**
 * Exige una jerarquía mínima.
 *
 * 3 = Operador
 * 4 = Verificador / Administrador
 * 5 = Superadmin
 */
export function requireHierarchy(minHierarchy: number = 3) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.operator) {
      res.status(401).json({
        ok: false,
        error: "ERR_UNAUTHORIZED",
        message: "Sesión no iniciada o token inválido",
      });
      return;
    }

    if (req.operator.jerarquia < minHierarchy) {
      res.status(403).json({
        ok: false,
        error: "ERR_FORBIDDEN",
        message: `Jerarquía insuficiente (${req.operator.jerarquia} < ${minHierarchy}) para acceder a este recurso`,
      });
      return;
    }

    next();
  };
}