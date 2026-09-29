import { Router, Response } from "express";
import { query } from "../lib/db";
import {
  loginSchema,
} from "../lib/schemas";
import {
  verifyPassword,
  signSessionToken,
  SESSION_COOKIE_NAME,
} from "../lib/authService";
import {
  AuthenticatedRequest,
  requireHierarchy,
} from "../middlewares/authMiddleware";

const router = Router();

/* POST /api/admin/auth/login */
router.post("/login", async (req, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: "ERR_VALIDATION",
        message: "Datos de acceso incompletos o con formato incorrecto",
        details: parsed.error.format(),
      });
      return;
    }

    const {
      email,
      password,
      recordar,
    } = parsed.data;

    const result = await query(
      `
      SELECT
        o.id,
        o.nombre,
        o.apellido,
        o.email_institucional,
        o.password_hash,
        o.activo,
        o.punto_acceso_default_id,
        o.rol_id,
        r.nombre AS rol_nombre,
        r.jerarquia
      FROM operadores o
      JOIN roles r ON r.id = o.rol_id
      WHERE LOWER(o.email_institucional) = LOWER($1)
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      await query(
        `
        INSERT INTO logs_auditoria (
          operador_id,
          accion,
          detalles,
          ip_origen
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          null,
          "LOGIN_FALLIDO",
          JSON.stringify({ email }),
          req.ip || "127.0.0.1",
        ]
      ).catch(() => {});

      res.status(401).json({
        ok: false,
        error: "ERR_INVALID_CREDENTIALS",
        message: "Credenciales inválidas o cuenta inexistente",
      });
      return;
    }

    const operador = result.rows[0];

    if (!operador.activo) {
      res.status(403).json({
        ok: false,
        error: "ERR_ACCOUNT_DISABLED",
        message: "Esta cuenta de operador ha sido desactivada",
      });
      return;
    }

    // En nuestro sistema los roles operativos comienzan en jerarquía 3.
    if (operador.jerarquia < 3) {
      res.status(403).json({
        ok: false,
        error: "ERR_INSUFFICIENT_CATEGORY",
        message: "Esta cuenta no tiene permisos operativos",
      });
      return;
    }

    const isValidPassword = verifyPassword(
      password,
      operador.password_hash
    );

    if (!isValidPassword) {
      await query(
        `
        INSERT INTO logs_auditoria (
          operador_id,
          accion,
          detalles,
          ip_origen
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          operador.id,
          "LOGIN_FALLIDO",
          JSON.stringify({ email }),
          req.ip || "127.0.0.1",
        ]
      ).catch(() => {});

      res.status(401).json({
        ok: false,
        error: "ERR_INVALID_CREDENTIALS",
        message: "Credenciales inválidas o cuenta inexistente",
      });
      return;
    }

    const expiresInSeconds = recordar
      ? 60 * 60 * 24 * 30
      : 60 * 60 * 24 * 7;

    const token = await signSessionToken(
      {
        sub: operador.id,
        email: operador.email_institucional,
        nombre: operador.nombre,
        apellido: operador.apellido,
        rol_id: operador.rol_id,
        rol_nombre: operador.rol_nombre,
        jerarquia: operador.jerarquia,
      },
      expiresInSeconds
    );

    await query(
      `
      INSERT INTO logs_auditoria (
        operador_id,
        accion,
        detalles,
        ip_origen
      )
      VALUES ($1, $2, $3, $4)
      `,
      [
        operador.id,
        "LOGIN_EXITOSO",
        JSON.stringify({
          operador_id: operador.id,
          rol: operador.rol_nombre,
        }),
        req.ip || "127.0.0.1",
      ]
    ).catch(() => {});

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresInSeconds * 1000,
    });

    res.json({
      ok: true,
      mensaje: "Autenticación exitosa",
      token,
      operador: {
        id: operador.id,
        nombre: operador.nombre,
        apellido: operador.apellido,
        email: operador.email_institucional,
        rol: operador.rol_nombre,
        jerarquia: operador.jerarquia,
        punto_acceso_default_id: operador.punto_acceso_default_id,
      },
    });
  } catch (error) {
    console.error("Error en POST /api/admin/auth/login:", error);

    res.status(500).json({
      ok: false,
      error: "ERR_AUTH_INTERNAL",
      message: "Error interno en el servidor de autenticación",
    });
  }
});

/* POST /api/admin/auth/logout */
router.post("/logout", (_req, res: Response) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    path: "/",
  });

  res.json({
    ok: true,
    mensaje: "Sesión cerrada con éxito",
  });
});

router.get(
  "/me",
  requireHierarchy(1),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      ok: true,
      operador: req.operator,
    });
  }
);

export default router;