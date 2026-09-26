import { Request, Response, NextFunction } from 'express';
import { verifySessionToken, SESSION_COOKIE_NAME, SessionPayload } from '../lib/authService';

export interface AuthenticatedRequest extends Request {
  operator?: SessionPayload;
}

/**
 * Middleware para extraer el operador de la sesión (cookie o header Bearer)
 */
export async function authenticateOperator(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Cookie congreso_session
    if (!token && req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
      token = req.cookies[SESSION_COOKIE_NAME];
    }

    if (token) {
      const payload = await verifySessionToken(token);
      if (payload) {
        req.operator = payload;
      }
    }

    next();
  } catch (error) {
    next();
  }
}

/**
 * Middleware para exigir jerarquía mínima
 * Jerarquías: 1: Asistente, 2: Expositor, 3: Operador, 4: Verificador/Admin, 5: Superadmin
 */
export function requireHierarchy(minHierarchy: number = 3) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.operator) {
      res.status(401).json({
        ok: false,
        error: 'ERR_UNAUTHORIZED',
        message: 'Sesión no iniciada o token inválido',
      });
      return;
    }

    if (req.operator.jerarquia < minHierarchy) {
      res.status(403).json({
        ok: false,
        error: 'ERR_FORBIDDEN',
        message: `Jerarquía insuficiente (${req.operator.jerarquia} < ${minHierarchy}) para acceder a este recurso`,
      });
      return;
    }

    next();
  };
}
