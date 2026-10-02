-- ==============================================================================
-- Migración / Parche de Base de Datos: Recintos y Tablas Complementarias
-- Fecha: 2026-09-26
-- Descripción: Agrega soporte para 'capacidad_maxima' y 'actualizado_en' en
--              puntos_acceso, tablas de catálogo y registros de auditoría.
-- ==============================================================================

BEGIN;

-- 1. Puntos de Acceso (Recintos): Aforo máximo y marca de tiempo
ALTER TABLE puntos_acceso 
  ADD COLUMN IF NOT EXISTS capacidad_maxima INT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Actualizar capacidades coherentes para los recintos predeterminados
UPDATE puntos_acceso SET capacidad_maxima = 500 WHERE id IN (1, 2) AND capacidad_maxima = 50;
UPDATE puntos_acceso SET capacidad_maxima = 400 WHERE id = 3 AND capacidad_maxima = 50;
UPDATE puntos_acceso SET capacidad_maxima = 100 WHERE id = 4 AND capacidad_maxima = 50;
UPDATE puntos_acceso SET capacidad_maxima = 60 WHERE id = 5 AND capacidad_maxima = 50;
UPDATE puntos_acceso SET capacidad_maxima = 35 WHERE id = 6 AND capacidad_maxima = 50;
UPDATE puntos_acceso SET capacidad_maxima = 50 WHERE id = 7 AND capacidad_maxima = 50;

-- 2. Catálogo de Actividades
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

-- 3. Actividades
ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS disertante_usuario_id UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS catalogo_actividad_id INT NULL REFERENCES catalogo_actividades(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Actividad Inscripciones
CREATE TABLE IF NOT EXISTS actividad_inscripciones (
    id SERIAL PRIMARY KEY,
    actividad_id INT NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(50) NOT NULL DEFAULT 'CONFIRMADO',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_actividad_usuario UNIQUE (actividad_id, usuario_id)
);

-- 5. Suscripciones Push
ALTER TABLE suscripciones_push
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Logs de Auditoría
ALTER TABLE logs_auditoria
  ADD COLUMN IF NOT EXISTS tabla_afectada VARCHAR(100),
  ADD COLUMN IF NOT EXISTS accion VARCHAR(50),
  ADD COLUMN IF NOT EXISTS usuario_responsable VARCHAR(100),
  ADD COLUMN IF NOT EXISTS datos_nuevos JSONB,
  ADD COLUMN IF NOT EXISTS registro_id VARCHAR(100);

COMMIT;
