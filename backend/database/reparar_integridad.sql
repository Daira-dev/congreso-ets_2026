-- ==============================================================================
-- RUTINA IDEMPOTENTE DE AUDITORÍA Y REPARACIÓN DE INTEGRIDAD REFERENCIAL
-- Sistema de Gestión Integral – Congreso ETS 2026 (DETS - GCABA)
-- ==============================================================================

BEGIN;

-- 1. EXTENSIÓN CRIPTOGRÁFICA
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. VERIFICACIÓN Y CREACIÓN DE TABLAS FALTANTES
-- Catálogo de Actividades
CREATE TABLE IF NOT EXISTS catalogo_actividades (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo_acreditacion_id INT NOT NULL REFERENCES tipos_acreditacion(id) ON DELETE RESTRICT,
    categoria_tematica_id INT NULL REFERENCES categorias_tematicas(id) ON DELETE SET NULL,
    horas_catedra INT NOT NULL DEFAULT 2,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actividad Inscripciones
CREATE TABLE IF NOT EXISTS actividad_inscripciones (
    id SERIAL PRIMARY KEY,
    actividad_id INT NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(50) NOT NULL DEFAULT 'CONFIRMADO',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_actividad_usuario UNIQUE (actividad_id, usuario_id)
);

-- 3. REPARACIÓN Y AGREGADO DE COLUMNAS FALTANTES
-- Eventos
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Operadores
ALTER TABLE operadores
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Puntos de acceso (recintos)
ALTER TABLE puntos_acceso 
  ADD COLUMN IF NOT EXISTS capacidad_maxima INT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS tipo_punto VARCHAR(30) NOT NULL DEFAULT 'PUESTO_ACCESO',
  ADD COLUMN IF NOT EXISTS evento_id INT REFERENCES eventos(id) ON DELETE CASCADE;

-- Actividades
ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS disertante_usuario_id UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS catalogo_actividad_id INT NULL REFERENCES catalogo_actividades(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Catalogo Actividades
ALTER TABLE catalogo_actividades
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Suscripciones push
ALTER TABLE suscripciones_push
  ADD COLUMN IF NOT EXISTS user_agent TEXT NULL,
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Logs auditoría
ALTER TABLE logs_auditoria
  ADD COLUMN IF NOT EXISTS tabla_afectada VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS accion VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS usuario_responsable VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS datos_nuevos JSONB NULL,
  ADD COLUMN IF NOT EXISTS registro_id VARCHAR(100) NULL;

-- Usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS evento_id INT NOT NULL DEFAULT 1;

-- 4. REPARACIÓN DE AFOROS EN RECINTOS PREEXISTENTES
UPDATE puntos_acceso SET capacidad_maxima = 500 WHERE id IN (1, 2) AND (capacidad_maxima IS NULL OR capacidad_maxima <= 50);
UPDATE puntos_acceso SET capacidad_maxima = 400 WHERE id = 3 AND (capacidad_maxima IS NULL OR capacidad_maxima <= 50);
UPDATE puntos_acceso SET capacidad_maxima = 100 WHERE id = 4 AND (capacidad_maxima IS NULL OR capacidad_maxima <= 50);
UPDATE puntos_acceso SET capacidad_maxima = 60 WHERE id = 5 AND (capacidad_maxima IS NULL OR capacidad_maxima <= 50);
UPDATE puntos_acceso SET capacidad_maxima = 35 WHERE id = 6 AND (capacidad_maxima IS NULL OR capacidad_maxima <= 50);
UPDATE puntos_acceso SET capacidad_maxima = 50 WHERE id = 7 AND (capacidad_maxima IS NULL OR capacidad_maxima <= 50);
UPDATE puntos_acceso SET capacidad_maxima = 50 WHERE capacidad_maxima IS NULL OR capacidad_maxima <= 0;

-- 5. REASIGNACIÓN DE CLAVES FORÁNEAS HUÉRFANAS
-- Evento base garantizado
INSERT INTO eventos (id, codigo, nombre, descripcion, anio, fecha_inicio, fecha_fin, activo) VALUES
  (1, 'ETS_2026', '1er Congreso de Educación Técnica Superior 2026', 'Edición inaugural en Auditorio Polo Saavedra', 2026, '2026-11-06', '2026-11-06', TRUE)
ON CONFLICT (id) DO UPDATE SET activo = TRUE;

-- Usuarios huérfanos
UPDATE usuarios SET evento_id = 1 WHERE evento_id IS NULL OR NOT EXISTS (SELECT 1 FROM eventos WHERE id = usuarios.evento_id);
UPDATE usuarios SET rol_principal_id = 1 WHERE rol_principal_id IS NULL OR NOT EXISTS (SELECT 1 FROM roles WHERE id = usuarios.rol_principal_id);
UPDATE usuarios SET estado_inscripcion_id = 1 WHERE estado_inscripcion_id IS NULL OR NOT EXISTS (SELECT 1 FROM estados_inscripcion WHERE id = usuarios.estado_inscripcion_id);

-- Operadores huérfanos
UPDATE operadores SET punto_acceso_default_id = 1 WHERE punto_acceso_default_id IS NULL OR NOT EXISTS (SELECT 1 FROM puntos_acceso WHERE id = operadores.punto_acceso_default_id);
UPDATE operadores SET rol_id = 5 WHERE rol_id IS NULL OR NOT EXISTS (SELECT 1 FROM roles WHERE id = operadores.rol_id);

-- Actividades huérfanas
UPDATE actividades SET evento_id = 1 WHERE evento_id IS NULL OR NOT EXISTS (SELECT 1 FROM eventos WHERE id = actividades.evento_id);
UPDATE actividades SET tipo_acreditacion_id = 1 WHERE tipo_acreditacion_id IS NULL OR NOT EXISTS (SELECT 1 FROM tipos_acreditacion WHERE id = actividades.tipo_acreditacion_id);
UPDATE actividades SET punto_acceso_id = 3 WHERE punto_acceso_id IS NULL OR NOT EXISTS (SELECT 1 FROM puntos_acceso WHERE id = actividades.punto_acceso_id);

-- Puntos de acceso con evento huérfano
UPDATE puntos_acceso SET evento_id = 1 WHERE evento_id IS NULL OR NOT EXISTS (SELECT 1 FROM eventos WHERE id = puntos_acceso.evento_id);

-- 6. LIMPIEZA DE OPERACIONES HUÉRFANAS
DELETE FROM actividad_inscripciones 
WHERE NOT EXISTS (SELECT 1 FROM actividades WHERE id = actividad_inscripciones.actividad_id)
   OR NOT EXISTS (SELECT 1 FROM usuarios WHERE id = actividad_inscripciones.usuario_id);

DELETE FROM acreditaciones 
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE id = acreditaciones.usuario_id);

-- 7. SINCRONIZACIÓN DE SECUENCIAS SERIAL
SELECT setval('roles_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 8) FROM roles));
SELECT setval('estados_inscripcion_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 5) FROM estados_inscripcion));
SELECT setval('eventos_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 2) FROM eventos));
SELECT setval('tipos_acreditacion_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 4) FROM tipos_acreditacion));
SELECT setval('categorias_tematicas_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 6) FROM categorias_tematicas));
SELECT setval('puntos_acceso_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 7) FROM puntos_acceso));
SELECT setval('catalogo_actividades_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 5) FROM catalogo_actividades));
SELECT setval('operadores_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 5) FROM operadores));
SELECT setval('actividades_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 6) FROM actividades));
SELECT setval('encuestas_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 1) FROM encuestas));
SELECT setval('encuesta_preguntas_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 3) FROM encuesta_preguntas));
SELECT setval('encuesta_opciones_id_seq', (SELECT GREATEST(COALESCE(MAX(id), 1), 5) FROM encuesta_opciones));

COMMIT;
