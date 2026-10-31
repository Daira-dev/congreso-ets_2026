import { Router, Response } from 'express';
import { query } from '../../lib/db';
import { AuthenticatedRequest, requireHierarchy } from '../../middlewares/authMiddleware';

const router = Router();

// Roles canónicos del sistema protegidos contra eliminación o degradación
const ROLES_SISTEMA_PROTEGIDOS = [
  'superadmin',
  'administrador',
  'operador',
  'verificador',
  'estudiante',
  'docente',
  'expositor',
  'autoridad',
];

/**
 * GET /api/admin/catalogos
 * Endpoint consolidado que provee roles, estados, puntos de acceso,
 * tipos de acreditación, actividades, catálogo canónico y disertantes.
 * Requiere jerarquía mínima 3 (Operador o superior) para prevenir exfiltración de PII.
 */
router.get('/', requireHierarchy(3), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      rolesRes,
      rolesParticipantesRes,
      estadosRes,
      puntosRes,
      tiposRes,
      actividadesRes,
      catActividadesRes,
      categoriasRes,
      disertantesRes,
    ] = await Promise.all([
      query(`SELECT id, nombre, descripcion, jerarquia, COALESCE(permisos, '[]'::jsonb) as permisos FROM roles ORDER BY jerarquia ASC, id ASC`),
      query(`SELECT id, nombre, descripcion, jerarquia, COALESCE(permisos, '[]'::jsonb) as permisos FROM roles WHERE jerarquia <= 2 ORDER BY jerarquia ASC, id ASC`),
      query(`SELECT id, codigo, nombre, permite_ingreso FROM estados_inscripcion ORDER BY id ASC`),
      query(`SELECT id, nombre, ubicacion_fisica, tipo_punto, capacidad_maxima, activo FROM puntos_acceso WHERE activo = TRUE ORDER BY id ASC`),
      query(`SELECT id, codigo, descripcion, requiere_actividad FROM tipos_acreditacion ORDER BY id ASC`),
      query(`SELECT id, nombre, tipo_acreditacion_id, punto_acceso_id, cupo_maximo, disertante_nombre, disertante_usuario_id, catalogo_actividad_id FROM actividades WHERE activo = TRUE ORDER BY id ASC`),
      query(`SELECT id, codigo, nombre, descripcion, tipo_acreditacion_id, categoria_tematica_id, horas_catedra, activo FROM catalogo_actividades WHERE activo = TRUE ORDER BY codigo ASC`),
      query(`SELECT id, nombre, descripcion, activo FROM categorias_tematicas WHERE activo = TRUE ORDER BY nombre ASC`),
      query(`
        SELECT DISTINCT u.id, u.nombre, u.apellido, u.email, u.dni_pasaporte, r.nombre AS rol_nombre,
               COALESCE(he.estado_homologacion, 'NO_REQUERIDO') AS homologacion_estado
        FROM usuarios u
        JOIN roles r ON r.id = u.rol_principal_id
        LEFT JOIN homologaciones_expositores he ON he.usuario_id = u.id
        WHERE r.nombre IN ('Expositor', 'Docente', 'Autoridad') 
           OR he.id IS NOT NULL
           OR EXISTS (
              SELECT 1 FROM usuario_roles_adicionales ura 
              JOIN roles r2 ON r2.id = ura.rol_id 
              WHERE ura.usuario_id = u.id AND r2.nombre IN ('Expositor', 'Docente')
           )
        ORDER BY u.apellido ASC, u.nombre ASC
      `),
    ]);

    const rolesOperadores = rolesRes.rows.filter(
      (r: any) => r.jerarquia >= 3
    );

    res.json({
      ok: true,
      roles: rolesRes.rows,
      roles_participantes: rolesParticipantesRes.rows,
      roles_operadores: rolesOperadores,
      estados: estadosRes.rows,
      puntos_acceso: puntosRes.rows,
      tipos_acreditacion: tiposRes.rows,
      actividades: actividadesRes.rows,
      catalogo_actividades: catActividadesRes.rows,
      categorias_tematicas: categoriasRes.rows,
      disertantes: disertantesRes.rows,
    });
  } catch (error: any) {
    console.error('Error en GET /api/admin/catalogos:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

// ==========================================
// CRUD ROLES INSTITUCIONALES (SUPERADMIN NIVEL 5)
// ==========================================

/**
 * POST /api/admin/catalogos/roles
 * Crea un rol institucional con permisos. Exclusivo de Superadmin (Nivel 5).
 */
router.post('/roles', requireHierarchy(5), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, jerarquia, permisos } = req.body;
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      res.status(400).json({ ok: false, message: 'El nombre del rol es obligatorio.' });
      return;
    }

    const cleanNombre = nombre.trim();

    // Comprobar colisión de nombres
    const dupCheck = await query(`SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1)`, [cleanNombre]);
    if (dupCheck.rows.length > 0) {
      res.status(409).json({ ok: false, message: `Ya existe un rol con el nombre "${cleanNombre}".` });
      return;
    }

    const jerarquiaNum = Math.min(5, Math.max(1, parseInt(jerarquia, 10) || 1));
    const permisosJson = Array.isArray(permisos) ? JSON.stringify(permisos) : '[]';

    const ins = await query(
      `INSERT INTO roles (nombre, descripcion, jerarquia, permisos) 
       VALUES ($1, $2, $3, $4::jsonb) 
       RETURNING id, nombre, descripcion, jerarquia, permisos`,
      [cleanNombre, descripcion ? String(descripcion).trim() : null, jerarquiaNum, permisosJson]
    );

    // Auditoría forense inmutable
    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, registro_id, accion, usuario_responsable, datos_nuevos) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'roles',
        ins.rows[0].id,
        'ROL_CREADO',
        req.operator?.email || 'SUPERADMIN',
        JSON.stringify(ins.rows[0]),
      ]
    ).catch(() => {});

    res.status(201).json({ ok: true, mensaje: 'Rol institucional creado exitosamente.', rol: ins.rows[0] });
  } catch (error: any) {
    console.error('Error en POST /api/admin/catalogos/roles:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * PUT /api/admin/catalogos/roles/:id
 * Modifica atributos y permisos de un rol. Exclusivo de Superadmin (Nivel 5).
 */
router.put('/roles/:id', requireHierarchy(5), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ ok: false, message: 'ID de rol inválido.' });
      return;
    }

    const currentRolRes = await query(`SELECT id, nombre, jerarquia, permisos FROM roles WHERE id = $1`, [id]);
    if (currentRolRes.rows.length === 0) {
      res.status(404).json({ ok: false, message: 'El rol especificado no existe.' });
      return;
    }

    const currentRol = currentRolRes.rows[0];
    const { nombre, descripcion, jerarquia, permisos } = req.body;

    // Protección de integridad: el rol Superadmin no puede ser degradado de jerarquía
    if (currentRol.jerarquia >= 5 && jerarquia !== undefined && parseInt(jerarquia, 10) < 5) {
      res.status(403).json({
        ok: false,
        message: 'Acción bloqueada: No se puede degradar la jerarquía de una cuenta o rol de nivel Superadmin.',
      });
      return;
    }

    let finalNombre = currentRol.nombre;
    if (nombre && typeof nombre === 'string' && nombre.trim()) {
      finalNombre = nombre.trim();
      // Si cambia de nombre, comprobar que no colisione con otro
      if (finalNombre.toLowerCase() !== currentRol.nombre.toLowerCase()) {
        const dupCheck = await query(`SELECT id FROM roles WHERE LOWER(nombre) = LOWER($1) AND id <> $2`, [finalNombre, id]);
        if (dupCheck.rows.length > 0) {
          res.status(409).json({ ok: false, message: `Ya existe otro rol con el nombre "${finalNombre}".` });
          return;
        }
      }
    }

    const finalJerarquia = jerarquia !== undefined
      ? Math.min(5, Math.max(1, parseInt(jerarquia, 10) || currentRol.jerarquia))
      : currentRol.jerarquia;

    const permisosJson = Array.isArray(permisos)
      ? JSON.stringify(permisos)
      : (permisos ? JSON.stringify(permisos) : null);

    let sql = `UPDATE roles SET nombre = $1, descripcion = COALESCE($2, descripcion), jerarquia = $3`;
    const params: any[] = [finalNombre, descripcion !== undefined ? (descripcion ? String(descripcion).trim() : null) : null, finalJerarquia];

    if (permisosJson !== null) {
      sql += `, permisos = $4::jsonb WHERE id = $5 RETURNING *`;
      params.push(permisosJson, id);
    } else {
      sql += ` WHERE id = $4 RETURNING *`;
      params.push(id);
    }

    const upd = await query(sql, params);

    // Auditoría forense
    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, registro_id, accion, usuario_responsable, datos_previos, datos_nuevos) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'roles',
        id,
        'ROL_ACTUALIZADO',
        req.operator?.email || 'SUPERADMIN',
        JSON.stringify(currentRol),
        JSON.stringify(upd.rows[0]),
      ]
    ).catch(() => {});

    res.json({ ok: true, mensaje: 'Rol institucional actualizado exitosamente.', rol: upd.rows[0] });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/catalogos/roles/:id:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * DELETE /api/admin/catalogos/roles/:id
 * Elimina un rol institucional si no tiene dependencias activas. Exclusivo de Superadmin (Nivel 5).
 */
router.delete('/roles/:id', requireHierarchy(5), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ ok: false, message: 'ID de rol inválido.' });
      return;
    }

    const rolCheck = await query(`SELECT id, nombre, jerarquia FROM roles WHERE id = $1`, [id]);
    if (rolCheck.rows.length === 0) {
      res.status(404).json({ ok: false, message: 'El rol especificado no existe.' });
      return;
    }

    const rol = rolCheck.rows[0];

    // Protección de roles esenciales del sistema
    if (
      rol.jerarquia >= 5 ||
      ROLES_SISTEMA_PROTEGIDOS.includes(rol.nombre.toLowerCase().trim())
    ) {
      res.status(403).json({
        ok: false,
        message: `Acción bloqueada: El rol esencial del sistema "${rol.nombre}" no puede ser eliminado.`,
      });
      return;
    }

    // Comprobar dependencias en usuarios
    const inUseUsuarios = await query(`SELECT COUNT(*)::int as c FROM usuarios WHERE rol_principal_id = $1`, [id]);
    if (inUseUsuarios.rows[0].c > 0) {
      res.status(409).json({
        ok: false,
        message: `No se puede eliminar el rol porque está asignado a ${inUseUsuarios.rows[0].c} participante(s) en la base de datos.`,
      });
      return;
    }

    // Comprobar dependencias en operadores
    const inUseOperadores = await query(`SELECT COUNT(*)::int as c FROM operadores WHERE rol_id = $1`, [id]);
    if (inUseOperadores.rows[0].c > 0) {
      res.status(409).json({
        ok: false,
        message: `No se puede eliminar el rol porque está asignado a ${inUseOperadores.rows[0].c} operador(es) del sistema.`,
      });
      return;
    }

    // Comprobar dependencias en roles adicionales
    const inUseAdicionales = await query(`SELECT COUNT(*)::int as c FROM usuario_roles_adicionales WHERE rol_id = $1`, [id]);
    if (inUseAdicionales.rows[0].c > 0) {
      res.status(409).json({
        ok: false,
        message: `No se puede eliminar el rol porque está asignado como rol adicional a ${inUseAdicionales.rows[0].c} usuario(s).`,
      });
      return;
    }

    await query(`DELETE FROM roles WHERE id = $1`, [id]);

    // Auditoría forense
    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, registro_id, accion, usuario_responsable, datos_previos) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'roles',
        id,
        'ROL_ELIMINADO',
        req.operator?.email || 'SUPERADMIN',
        JSON.stringify(rol),
      ]
    ).catch(() => {});

    res.json({ ok: true, mensaje: `Rol institucional "${rol.nombre}" eliminado correctamente.` });
  } catch (error: any) {
    console.error('Error en DELETE /api/admin/catalogos/roles/:id:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

// ==========================================
// CRUD TIPOS DE ACREDITACIÓN (NIVEL 4+)
// ==========================================

/**
 * POST /api/admin/catalogos/tipos-acreditacion
 */
router.post('/tipos-acreditacion', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { codigo, descripcion, requiere_actividad } = req.body;
    if (!codigo || !descripcion) {
      res.status(400).json({ ok: false, message: 'Código y Descripción son obligatorios.' });
      return;
    }

    const cleanCodigo = String(codigo).toUpperCase().trim();
    const dupCheck = await query(`SELECT id FROM tipos_acreditacion WHERE codigo = $1`, [cleanCodigo]);
    if (dupCheck.rows.length > 0) {
      res.status(409).json({ ok: false, message: `Ya existe un tipo de acreditación con el código "${cleanCodigo}".` });
      return;
    }

    const ins = await query(
      `INSERT INTO tipos_acreditacion (codigo, descripcion, requiere_actividad) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [cleanCodigo, String(descripcion).trim(), requiere_actividad === true || requiere_actividad === 'true']
    );

    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, registro_id, accion, usuario_responsable, datos_nuevos) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['tipos_acreditacion', ins.rows[0].id, 'TIPO_ACREDITACION_CREADO', req.operator?.email || 'ADMIN', JSON.stringify(ins.rows[0])]
    ).catch(() => {});

    res.status(201).json({ ok: true, mensaje: 'Tipo de acreditación creado exitosamente.', tipo: ins.rows[0] });
  } catch (error: any) {
    console.error('Error en POST /api/admin/catalogos/tipos-acreditacion:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * PUT /api/admin/catalogos/tipos-acreditacion/:id
 */
router.put('/tipos-acreditacion/:id', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ ok: false, message: 'ID de tipo de acreditación inválido.' });
      return;
    }

    const { descripcion, requiere_actividad } = req.body;
    const upd = await query(
      `UPDATE tipos_acreditacion 
       SET descripcion = COALESCE($1, descripcion), 
           requiere_actividad = COALESCE($2, requiere_actividad) 
       WHERE id = $3 
       RETURNING *`,
      [descripcion ? String(descripcion).trim() : null, requiere_actividad, id]
    );

    if (upd.rows.length === 0) {
      res.status(404).json({ ok: false, message: 'Tipo de acreditación no encontrado.' });
      return;
    }

    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, registro_id, accion, usuario_responsable, datos_nuevos) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['tipos_acreditacion', id, 'TIPO_ACREDITACION_ACTUALIZADO', req.operator?.email || 'ADMIN', JSON.stringify(upd.rows[0])]
    ).catch(() => {});

    res.json({ ok: true, mensaje: 'Tipo de acreditación actualizado exitosamente.', tipo: upd.rows[0] });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/catalogos/tipos-acreditacion/:id:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

// ==========================================
// CRUD CATEGORÍAS TEMÁTICAS (NIVEL 4+)
// ==========================================

/**
 * POST /api/admin/catalogos/categorias-tematicas
 */
router.post('/categorias-tematicas', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      res.status(400).json({ ok: false, message: 'El nombre de la categoría es obligatorio.' });
      return;
    }

    const cleanNombre = nombre.trim();
    const dupCheck = await query(`SELECT id FROM categorias_tematicas WHERE LOWER(nombre) = LOWER($1)`, [cleanNombre]);
    if (dupCheck.rows.length > 0) {
      res.status(409).json({ ok: false, message: `Ya existe una categoría temática con el nombre "${cleanNombre}".` });
      return;
    }

    const ins = await query(
      `INSERT INTO categorias_tematicas (nombre, descripcion, activo) 
       VALUES ($1, $2, TRUE) 
       RETURNING *`,
      [cleanNombre, descripcion ? String(descripcion).trim() : null]
    );

    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, registro_id, accion, usuario_responsable, datos_nuevos) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['categorias_tematicas', ins.rows[0].id, 'CATEGORIA_TEMATICA_CREADA', req.operator?.email || 'ADMIN', JSON.stringify(ins.rows[0])]
    ).catch(() => {});

    res.status(201).json({ ok: true, mensaje: 'Categoría temática creada exitosamente.', categoria: ins.rows[0] });
  } catch (error: any) {
    console.error('Error en POST /api/admin/catalogos/categorias-tematicas:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

/**
 * PUT /api/admin/catalogos/categorias-tematicas/:id
 */
router.put('/categorias-tematicas/:id', requireHierarchy(4), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ ok: false, message: 'ID de categoría inválido.' });
      return;
    }

    const { nombre, descripcion, activo } = req.body;
    const upd = await query(
      `UPDATE categorias_tematicas 
       SET nombre = COALESCE($1, nombre), 
           descripcion = COALESCE($2, descripcion), 
           activo = COALESCE($3, activo) 
       WHERE id = $4 
       RETURNING *`,
      [nombre ? String(nombre).trim() : null, descripcion !== undefined ? (descripcion ? String(descripcion).trim() : null) : null, activo, id]
    );

    if (upd.rows.length === 0) {
      res.status(404).json({ ok: false, message: 'Categoría temática no encontrada.' });
      return;
    }

    await query(
      `INSERT INTO logs_auditoria (tabla_afectada, registro_id, accion, usuario_responsable, datos_nuevos) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['categorias_tematicas', id, 'CATEGORIA_TEMATICA_ACTUALIZADA', req.operator?.email || 'ADMIN', JSON.stringify(upd.rows[0])]
    ).catch(() => {});

    res.json({ ok: true, mensaje: 'Categoría temática actualizada exitosamente.', categoria: upd.rows[0] });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/catalogos/categorias-tematicas/:id:', error);
    res.status(500).json({ ok: false, error: 'ERR_DATABASE', message: error.message });
  }
});

export default router;
