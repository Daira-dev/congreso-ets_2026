-- --------------------------------------- •
-- CONGRESO ETS 2026 - BACKEND PROVISORIO
-- Datos iniciales de desarrollo
-- --------------------------------------- •

\encoding UTF8

-- --------------------------------------- •
-- 1. ROLES
-- --------------------------------------- •

INSERT INTO roles (nombre, descripcion, jerarquia) VALUES
    ('Estudiante', 'Estudiante de Nivel Técnico Superior o afín', 1),
    ('Docente', 'Personal académico / Docente', 1),
    ('Expositor', 'Disertante o Tallerista', 2),
    ('Autoridad', 'Autoridad Institucional / Ministerial / Invitado Especial', 2),
    ('Operador', 'Personal autorizado para operar el sistema', 3),
    ('Verificador', 'Funcionario habilitado para tareas de verificación', 4),
    ('Administrador', 'Personal autorizado para administrar el sistema', 4),
    ('Superadmin', 'Administrador con permisos máximos', 5)
ON CONFLICT (nombre) DO UPDATE
SET descripcion = EXCLUDED.descripcion,
    jerarquia = EXCLUDED.jerarquia;


-- --------------------------------------- •
-- 2. ESTADOS DE INSCRIPCIÓN
-- --------------------------------------- •

INSERT INTO estados_inscripcion (
    codigo,
    nombre,
    permite_ingreso,
    descripcion
) VALUES
    (
        'CONFIRMADO',
        'Confirmado',
        TRUE,
        'Inscripción confirmada con cupo disponible.'
    ),
    (
        'LISTA_ESPERA',
        'Lista de Espera',
        FALSE,
        'Registro realizado luego de alcanzar el cupo de confirmados.'
    ),
    (
        'CANCELADO',
        'Cancelado',
        FALSE,
        'Inscripción cancelada.'
    )
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    permite_ingreso = EXCLUDED.permite_ingreso,
    descripcion = EXCLUDED.descripcion;


-- --------------------------------------- •
-- 3. EVENTO
-- --------------------------------------- •

INSERT INTO eventos (
    codigo,
    nombre,
    lema,
    descripcion,
    anio,
    fecha_inicio,
    fecha_fin,
    horario_apertura,
    horario_cierre,
    lugar_nombre,
    direccion,
    ciudad,
    cupo_maximo,
    estado,
    activo
) VALUES (
    'ETS_2026',
    '1er Congreso de Educación Técnica Superior – ETS 2026',
    'Construyendo Futuros desde la Educación Técnica Superior',
    'Instancia institucional, académico-aplicada, demostrativa y formativa de la Educación Técnica Superior.',
    2026,
    '2026-11-06',
    '2026-11-06',
    '10:30',
    '20:30',
    'Universidad de la Ciudad de Buenos Aires',
    'Tte. Gral. Juan Domingo Perón 802',
    'Ciudad Autónoma de Buenos Aires',
    10,
    'PUBLICADO',
    TRUE
)
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    lema = EXCLUDED.lema,
    descripcion = EXCLUDED.descripcion,
    anio = EXCLUDED.anio,
    fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_fin = EXCLUDED.fecha_fin,
    horario_apertura = EXCLUDED.horario_apertura,
    horario_cierre = EXCLUDED.horario_cierre,
    lugar_nombre = EXCLUDED.lugar_nombre,
    direccion = EXCLUDED.direccion,
    ciudad = EXCLUDED.ciudad,
    cupo_maximo = EXCLUDED.cupo_maximo,
    estado = EXCLUDED.estado,
    activo = EXCLUDED.activo;


-- --------------------------------------- •
-- 4. PUNTOS / ESPACIOS DE OPERACIÓN
-- --------------------------------------- •

INSERT INTO puntos_acceso (
    evento_id,
    nombre,
    ubicacion_fisica,
    tipo_punto,
    activo
)
SELECT
    e.id,
    'Acceso General',
    'Ingreso principal',
    'OPERACION',
    TRUE
FROM eventos e
WHERE e.codigo = 'ETS_2026'
ON CONFLICT (evento_id, nombre) DO UPDATE
SET ubicacion_fisica = EXCLUDED.ubicacion_fisica,
    tipo_punto = EXCLUDED.tipo_punto,
    activo = EXCLUDED.activo;

INSERT INTO puntos_acceso (
    evento_id,
    nombre,
    ubicacion_fisica,
    tipo_punto,
    activo
)
SELECT
    e.id,
    'Puesto de Acreditación',
    'Sector de acreditación',
    'OPERACION',
    TRUE
FROM eventos e
WHERE e.codigo = 'ETS_2026'
ON CONFLICT (evento_id, nombre) DO UPDATE
SET ubicacion_fisica = EXCLUDED.ubicacion_fisica,
    tipo_punto = EXCLUDED.tipo_punto,
    activo = EXCLUDED.activo;


-- --------------------------------------- •
-- 5. TIPOS DE ACREDITACIÓN
-- --------------------------------------- •

INSERT INTO tipos_acreditacion (
    codigo,
    descripcion,
    requiere_actividad
) VALUES
    (
        'ACCESO_GENERAL',
        'Acreditación general al Congreso',
        FALSE
    ),
    (
        'ACTIVIDAD_AULA',
        'Asistencia a actividad o presentación',
        TRUE
    ),
    (
        'TALLER',
        'Participación en taller',
        TRUE
    ),
    (
        'MASTERCLASS',
        'Participación en masterclass',
        TRUE
    )
ON CONFLICT (codigo) DO UPDATE
SET descripcion = EXCLUDED.descripcion,
    requiere_actividad = EXCLUDED.requiere_actividad;


-- --------------------------------------- •
-- 6. CONFIGURACIONES DEL SISTEMA
-- --------------------------------------- •

INSERT INTO configuraciones_sistema (
    clave,
    valor,
    descripcion,
    categoria
) VALUES
    (
        'aforo_maximo_confirmados',
        '{"cupo": 10}',
        'Cupo máximo de inscripciones confirmadas para desarrollo y pruebas.',
        'INSCRIPCION'
    ),
    (
        'inscripciones_habilitadas',
        '{"habilitada": true}',
        'Permite habilitar o deshabilitar el registro público.',
        'INSCRIPCION'
    )
ON CONFLICT (clave) DO UPDATE
SET valor = EXCLUDED.valor,
    descripcion = EXCLUDED.descripcion,
    categoria = EXCLUDED.categoria;


-- --------------------------------------- •
-- 7. OPERADORES
-- --------------------------------------- •

INSERT INTO operadores (
    nombre,
    apellido,
    email_institucional,
    punto_acceso_default_id,
    rol_id,
    password_hash,
    activo
)
SELECT
    'Operador 1',
    'Puerta Principal',
    'operador1.puerta@bue.edu.ar',
    p.id,
    r.id,
    '519a19591492bc470768b209e257eb3c:d947231ce81bfbe779836371cb765f04230d70da6d892ba94a530eb6a5f54316d9a9f2ce5eec5926ec03ddc4a9a0d8bbecceba462f92a472c3d014bc9fa86178',
    TRUE
FROM puntos_acceso p
CROSS JOIN roles r
WHERE p.nombre = 'Acceso General'
  AND p.evento_id = (
      SELECT id
      FROM eventos
      WHERE codigo = 'ETS_2026'
  )
  AND r.nombre = 'Operador'
ON CONFLICT (email_institucional) DO UPDATE
SET rol_id = EXCLUDED.rol_id,
    punto_acceso_default_id = EXCLUDED.punto_acceso_default_id,
    password_hash = EXCLUDED.password_hash,
    activo = EXCLUDED.activo;


INSERT INTO operadores (
    nombre,
    apellido,
    email_institucional,
    punto_acceso_default_id,
    rol_id,
    password_hash,
    activo
)
SELECT
    'Operador 2',
    'Acreditación',
    'operador2.lateral@bue.edu.ar',
    p.id,
    r.id,
    '519a19591492bc470768b209e257eb3c:d947231ce81bfbe779836371cb765f04230d70da6d892ba94a530eb6a5f54316d9a9f2ce5eec5926ec03ddc4a9a0d8bbecceba462f92a472c3d014bc9fa86178',
    TRUE
FROM puntos_acceso p
CROSS JOIN roles r
WHERE p.nombre = 'Puesto de Acreditación'
  AND p.evento_id = (
      SELECT id
      FROM eventos
      WHERE codigo = 'ETS_2026'
  )
  AND r.nombre = 'Operador'
ON CONFLICT (email_institucional) DO UPDATE
SET rol_id = EXCLUDED.rol_id,
    punto_acceso_default_id = EXCLUDED.punto_acceso_default_id,
    password_hash = EXCLUDED.password_hash,
    activo = EXCLUDED.activo;


INSERT INTO operadores (
    nombre,
    apellido,
    email_institucional,
    punto_acceso_default_id,
    rol_id,
    password_hash,
    activo
)
SELECT
    'Administrador',
    'General',
    'admin@ifts04.edu.ar',
    p.id,
    r.id,
    '538c470bca95df46c04dce90b4d83bb3:a7bb8abcf659ac6c7a3cbdb35470359dfe93ab963a1ad458a810e58b90630c707279df9ae6d641c158fd45883fff51ccba64d260cd7b050453262e3f07178eeb',
    TRUE
FROM puntos_acceso p
CROSS JOIN roles r
WHERE p.nombre = 'Acceso General'
  AND p.evento_id = (
      SELECT id
      FROM eventos
      WHERE codigo = 'ETS_2026'
  )
  AND r.nombre = 'Administrador'
ON CONFLICT (email_institucional) DO UPDATE
SET rol_id = EXCLUDED.rol_id,
    punto_acceso_default_id = EXCLUDED.punto_acceso_default_id,
    password_hash = EXCLUDED.password_hash,
    activo = EXCLUDED.activo;


INSERT INTO operadores (
    nombre,
    apellido,
    email_institucional,
    punto_acceso_default_id,
    rol_id,
    password_hash,
    activo
)
SELECT
    'Superadmin',
    'General',
    'superadmin.congreso@bue.edu.ar',
    p.id,
    r.id,
    'f8bb2219633e8e7d23d85836fae758a5:fe5e227091448b111dc54b1f49e49cb4a52ff37cff385b2ee50ba3ee27bb61c7414bc9697d812239f60f64beae89fa0821d3780369a4781498b3f6e1f0e4b8',
    TRUE
FROM puntos_acceso p
CROSS JOIN roles r
WHERE p.nombre = 'Acceso General'
  AND p.evento_id = (
      SELECT id
      FROM eventos
      WHERE codigo = 'ETS_2026'
  )
  AND r.nombre = 'Superadmin'
ON CONFLICT (email_institucional) DO UPDATE
SET rol_id = EXCLUDED.rol_id,
    punto_acceso_default_id = EXCLUDED.punto_acceso_default_id,
    activo = EXCLUDED.activo;