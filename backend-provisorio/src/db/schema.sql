-- --------------------------------------- •
-- CONGRESO ETS 2026 - BACKEND PROVISORIO
-- Segunda entrega
-- --------------------------------------- •

\encoding UTF8
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -- --------------------------------------- •
-- 1. ROLES
-- -- --------------------------------------- •
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    jerarquia INT NOT NULL DEFAULT 1,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -- --------------------------------------- •
-- 2. ESTADOS DE INSCRIPCIÓN
-- -- --------------------------------------- •

CREATE TABLE IF NOT EXISTS estados_inscripcion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    permite_ingreso BOOLEAN NOT NULL DEFAULT FALSE,
    descripcion TEXT
);


-- -- --------------------------------------- •
-- 3. EVENTOS
-- El cupo NO queda hardcodeado. Se configura por evento
-- -- -- --------------------------------------- •

CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,

    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,

    lema VARCHAR(250),
    descripcion TEXT,

    anio INT NOT NULL,

    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,

    horario_apertura VARCHAR(10),
    horario_cierre VARCHAR(10),

    lugar_nombre VARCHAR(200),
    direccion VARCHAR(250),
    ciudad VARCHAR(100),

    cupo_maximo INT,

    estado VARCHAR(30) NOT NULL DEFAULT 'PUBLICADO',

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_evento_cupo
        CHECK (cupo_maximo IS NULL OR cupo_maximo > 0),

    CONSTRAINT chk_evento_fechas
        CHECK (fecha_fin >= fecha_inicio)
);


-- -- -- --------------------------------------- •
-- 4. PUNTOS / ESPACIOS DE OPERACIÓN
-- -- -- --------------------------------------- •

CREATE TABLE IF NOT EXISTS puntos_acceso (
    id SERIAL PRIMARY KEY,

    evento_id INT REFERENCES eventos(id) ON DELETE CASCADE,

    nombre VARCHAR(150) NOT NULL,
    ubicacion_fisica VARCHAR(200),

    tipo_punto VARCHAR(50) NOT NULL DEFAULT 'OPERACION',

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_punto_evento
        UNIQUE (evento_id, nombre)
);


-- -- -- --------------------------------------- •
-- 5. TIPOS DE ACREDITACIÓN
-- -- -- --------------------------------------- •

CREATE TABLE IF NOT EXISTS tipos_acreditacion (
    id SERIAL PRIMARY KEY,

    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(150) NOT NULL,

    requiere_actividad BOOLEAN NOT NULL DEFAULT FALSE
);


-- -- -- --------------------------------------- •
-- 6. ACTIVIDADES
-- El programa puede administrarse sin modificar código.
-- -- -- --------------------------------------- •

CREATE TABLE IF NOT EXISTS actividades (
    id SERIAL PRIMARY KEY,

    evento_id INT NOT NULL
        REFERENCES eventos(id)
        ON DELETE CASCADE,

    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,

    tipo VARCHAR(100),

    tipo_acreditacion_id INT
        REFERENCES tipos_acreditacion(id)
        ON DELETE RESTRICT,

    punto_acceso_id INT
        REFERENCES puntos_acceso(id)
        ON DELETE SET NULL,

    cupo_maximo INT,

    horario_inicio TIMESTAMPTZ NOT NULL,
    horario_fin TIMESTAMPTZ,

    disertante_nombre VARCHAR(255),

    activa BOOLEAN NOT NULL DEFAULT TRUE,
    publicada BOOLEAN NOT NULL DEFAULT FALSE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_actividad_cupo
        CHECK (cupo_maximo IS NULL OR cupo_maximo > 0),

    CONSTRAINT chk_actividad_horario
        CHECK (
            horario_fin IS NULL
            OR horario_fin > horario_inicio
        )
);


-- -- -- --------------------------------------- •
-- 7. USUARIOS / ASISTENTES
-- "dni_pasaporte" se mantiene, pero se agrega tipo_documento
-- No se hace UNIQUE sobre nombre.
-- -- -- --------------------------------------- •

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    evento_id INT NOT NULL
        REFERENCES eventos(id)
        ON DELETE RESTRICT,

    tipo_documento VARCHAR(30) NOT NULL,
    dni_pasaporte VARCHAR(50) NOT NULL,

    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL,
    celular VARCHAR(30),

    institucion VARCHAR(200),

    rol_principal_id INT NOT NULL
        REFERENCES roles(id)
        ON DELETE RESTRICT,

    condiciones_adicionales TEXT,

    intereses TEXT,

    acepta_comunicaciones BOOLEAN NOT NULL DEFAULT FALSE,

    estado_inscripcion_id INT NOT NULL
        REFERENCES estados_inscripcion(id)
        ON DELETE RESTRICT,

    -- Se genera únicamente para inscripciones confirmadas
    qr_token UUID UNIQUE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_usuario_documento_evento
        UNIQUE (tipo_documento, dni_pasaporte, evento_id)
);


-- -- -- --------------------------------------- •
-- 8. ROLES / CONDICIONES ADICIONALES
-- -- -- --------------------------------------- •

CREATE TABLE IF NOT EXISTS usuario_roles_adicionales (
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    rol_id INT NOT NULL
        REFERENCES roles(id)
        ON DELETE CASCADE,

    asignado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (usuario_id, rol_id)
);


-- -- -- --------------------------------------- •
-- 9. OPERADORES
-- El acceso al sistema se determina mediante el rol asignado
-- Los operadores son personas autorizadas a utilizar el sistema
-- -- -- --------------------------------------- •

CREATE TABLE IF NOT EXISTS operadores (
    id SERIAL PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,

    email_institucional VARCHAR(150) NOT NULL UNIQUE,

    rol_id INT NOT NULL
        REFERENCES roles(id)
        ON DELETE RESTRICT,

    punto_acceso_default_id INT
        REFERENCES puntos_acceso(id)
        ON DELETE SET NULL,

    password_hash VARCHAR(255),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -- -- --------------------------------------- •
-- 10. ACREDITACIÓN GENERAL
-- Una persona puede acreditar su ingreso UNA SOLA VEZ
-- No se registra ingreso/egreso del edificio
-- -- -- --------------------------------------- •

CREATE TABLE IF NOT EXISTS acreditaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    operador_id INT
        REFERENCES operadores(id)
        ON DELETE SET NULL,

    punto_acceso_id INT
        REFERENCES puntos_acceso(id)
        ON DELETE SET NULL,

    es_manual BOOLEAN NOT NULL DEFAULT FALSE,

    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_acreditacion_usuario
        UNIQUE (usuario_id)
);


-- -- -- --------------------------------------- •
-- 11. ASISTENCIAS A ACTIVIDADES
-- -- -- --------------------------------------- •

CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    actividad_id INT NOT NULL
        REFERENCES actividades(id)
        ON DELETE CASCADE,

    operador_id INT
        REFERENCES operadores(id)
        ON DELETE SET NULL,

    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_asistencia_usuario_actividad
        UNIQUE (usuario_id, actividad_id)
);


-- -- -- --------------------------------------- •
-- 12. CONFIGURACIÓN DEL SISTEMA
-- Permite activar/desactivar inscripción y guardar configuración
-- sin modificar código
-- -- -- --------------------------------------- •

CREATE TABLE IF NOT EXISTS configuraciones_sistema (
    clave VARCHAR(100) PRIMARY KEY,

    valor JSONB NOT NULL,

    descripcion TEXT,

    categoria VARCHAR(50) NOT NULL DEFAULT 'GENERAL',

    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -- -- --------------------------------------- •
-- 13. LOGS DE AUDITORÍA
-- Permite saber quién realizó una acreditación, asistencia, modificación administrativa, etc.
-- -- --------------------------------------- •
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id BIGSERIAL PRIMARY KEY,

    operador_id INT
        REFERENCES operadores(id)
        ON DELETE SET NULL,

    accion VARCHAR(100) NOT NULL,

    usuario_id UUID
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    detalles JSONB,

    ip_origen VARCHAR(45),

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------- •
-- 14. CONTENIDO / CMS
-- --------------------------------------- •

CREATE TABLE IF NOT EXISTS novedades (
    id SERIAL PRIMARY KEY,
    evento_id INT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    resumen VARCHAR(500),
    contenido TEXT NOT NULL,
    imagen_url VARCHAR(500),
    publicada BOOLEAN NOT NULL DEFAULT FALSE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (evento_id, slug)
);

CREATE TABLE IF NOT EXISTS materiales (
    id SERIAL PRIMARY KEY,
    evento_id INT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    archivo_url VARCHAR(500),
    publicada BOOLEAN NOT NULL DEFAULT FALSE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preguntas_frecuentes (
    id SERIAL PRIMARY KEY,
    evento_id INT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    pregunta VARCHAR(500) NOT NULL,
    respuesta TEXT NOT NULL,
    orden INT NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -- -- --------------------------------------- •
-- 15. ÍNDICES
-- -- -- --------------------------------------- •

CREATE INDEX IF NOT EXISTS idx_novedades_evento
    ON novedades(evento_id);

CREATE INDEX IF NOT EXISTS idx_novedades_publicada
    ON novedades(evento_id, publicada, activa);

CREATE INDEX IF NOT EXISTS idx_materiales_evento
    ON materiales(evento_id);

CREATE INDEX IF NOT EXISTS idx_materiales_publicada
    ON materiales(evento_id, publicada, activa);

CREATE INDEX IF NOT EXISTS idx_faq_evento
    ON preguntas_frecuentes(evento_id);

CREATE INDEX IF NOT EXISTS idx_faq_activa
    ON preguntas_frecuentes(evento_id, activa, orden);

CREATE INDEX IF NOT EXISTS idx_usuarios_apellido
    ON usuarios(apellido);

CREATE INDEX IF NOT EXISTS idx_usuarios_email
    ON usuarios(email);

CREATE INDEX IF NOT EXISTS idx_usuarios_institucion
    ON usuarios(institucion);

CREATE INDEX IF NOT EXISTS idx_usuarios_estado
    ON usuarios(estado_inscripcion_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_evento
    ON usuarios(evento_id);

CREATE INDEX IF NOT EXISTS idx_actividades_evento
    ON actividades(evento_id);

CREATE INDEX IF NOT EXISTS idx_actividades_fecha
    ON actividades(horario_inicio);

CREATE INDEX IF NOT EXISTS idx_actividades_publicadas
    ON actividades(publicada);

CREATE INDEX IF NOT EXISTS idx_acreditaciones_fecha
    ON acreditaciones(fecha_hora);

CREATE INDEX IF NOT EXISTS idx_asistencias_actividad
    ON asistencias(actividad_id);

CREATE INDEX IF NOT EXISTS idx_asistencias_fecha
    ON asistencias(fecha_hora);

CREATE INDEX IF NOT EXISTS idx_logs_operador
    ON logs_auditoria(operador_id);

CREATE INDEX IF NOT EXISTS idx_logs_fecha
    ON logs_auditoria(creado_en);