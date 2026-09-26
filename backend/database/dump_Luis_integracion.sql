--
-- PostgreSQL database dump
--

\restrict 4eohhBxj9y5IJAFkTKO2Zf4FjPXypwtNNR6cPacpQ1gAfeFbvJjDdEerhp60ekO

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: registrar_usuario_seguro(character varying, character varying, character varying, character varying, character varying, integer, text, jsonb, boolean, integer); Type: FUNCTION; Schema: public; Owner: congreso_app
--

CREATE FUNCTION public.registrar_usuario_seguro(p_dni_pasaporte character varying, p_nombre character varying, p_apellido character varying, p_email character varying, p_celular character varying, p_rol_principal_id integer, p_foto_url text, p_foto_metadata jsonb, p_es_superadmin_override boolean DEFAULT false, p_evento_id integer DEFAULT NULL::integer) RETURNS TABLE(new_id uuid, estado_codigo character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_sancionado INT;
    v_count INT;
    v_estado_id INT;
    v_estado_codigo VARCHAR(30);
    v_inserted_id UUID;
    v_id_confirmado INT;
    v_id_espera INT;
    v_id_cancelado INT;
    v_id_baja INT;
    v_en_blacklist BOOLEAN;
    v_max_cupo INT := 400;
    v_evento_id INT;
    v_usuario_existente_id UUID;
    v_estado_actual_id INT;
BEGIN
    -- Determinar evento de destino (por parÃƒÆ’Ã‚Â¡metro o evento activo por defecto)
    IF p_evento_id IS NOT NULL THEN
        v_evento_id := p_evento_id;
    ELSE
        SELECT id INTO v_evento_id FROM eventos WHERE activo = TRUE ORDER BY anio DESC LIMIT 1;
        IF v_evento_id IS NULL THEN
            v_evento_id := 1;
        END IF;
    END IF;

    -- Obtener cupo dinÃƒÆ’Ã‚Â¡mico del evento
    SELECT COALESCE(cupo_maximo, 400) INTO v_max_cupo FROM eventos WHERE id = v_evento_id;
    IF v_max_cupo IS NULL THEN
        v_max_cupo := 400;
    END IF;

    -- Obtener IDs de estados normalizados
    SELECT id INTO v_id_confirmado FROM estados_inscripcion WHERE codigo = 'CONFIRMADO';
    SELECT id INTO v_id_espera FROM estados_inscripcion WHERE codigo = 'LISTA_ESPERA';
    SELECT id INTO v_id_sancionado FROM estados_inscripcion WHERE codigo = 'SANCIONADO';
    SELECT id INTO v_id_cancelado FROM estados_inscripcion WHERE codigo = 'CANCELADO';
    SELECT id INTO v_id_baja FROM estados_inscripcion WHERE codigo = 'BAJA_AUTOMATICA';

    -- Validar si el DNI figura en blacklist
    SELECT EXISTS (
        SELECT 1 FROM blacklist WHERE dni_pasaporte = p_dni_pasaporte AND activo = TRUE
    ) INTO v_en_blacklist;

    -- Determinar estado que corresponderÃƒÆ’Ã‚Â­a
    IF p_es_superadmin_override THEN
        PERFORM set_config('app.superadmin_override', 'true', true);
        v_estado_id := v_id_confirmado;
        v_estado_codigo := 'CONFIRMADO';
    ELSIF v_en_blacklist THEN
        PERFORM set_config('app.superadmin_override', 'false', true);
        v_estado_id := v_id_sancionado;
        v_estado_codigo := 'SANCIONADO';
    ELSE
        PERFORM set_config('app.superadmin_override', 'false', true);

        -- Bloqueo pesimista del evento para control estricto de concurrencia
        PERFORM 1 FROM eventos WHERE id = v_evento_id FOR UPDATE;

        SELECT COUNT(*) INTO v_count 
        FROM usuarios 
        WHERE estado_inscripcion_id = v_id_confirmado AND evento_id = v_evento_id;

        -- Cupo protegido protocolar: Autoridades (Rol 4) y Expositores (Rol 3) tienen reserva institucional
        IF p_rol_principal_id IN (3, 4) THEN
            v_estado_id := v_id_confirmado;
            v_estado_codigo := 'CONFIRMADO';
        ELSIF v_count < v_max_cupo THEN
            v_estado_id := v_id_confirmado;
            v_estado_codigo := 'CONFIRMADO';
        ELSE
            v_estado_id := v_id_espera;
            v_estado_codigo := 'LISTA_ESPERA';
        END IF;
    END IF;

    -- Verificar si el usuario ya existe en este evento especÃƒÆ’Ã‚Â­fico
    SELECT id, estado_inscripcion_id INTO v_usuario_existente_id, v_estado_actual_id
    FROM usuarios
    WHERE dni_pasaporte = p_dni_pasaporte AND evento_id = v_evento_id;

    IF v_usuario_existente_id IS NOT NULL THEN
        -- Si estaba CANCELADO o BAJA_AUTOMATICA, se reactiva con sus nuevos datos y nuevo estado
        IF v_estado_actual_id IN (v_id_cancelado, v_id_baja) THEN
            UPDATE usuarios
            SET nombre = p_nombre,
                apellido = p_apellido,
                email = p_email,
                celular = p_celular,
                rol_principal_id = p_rol_principal_id,
                estado_inscripcion_id = v_estado_id,
                foto_url = COALESCE(p_foto_url, foto_url),
                foto_metadata = COALESCE(p_foto_metadata, foto_metadata),
                actualizado_en = NOW()
            WHERE id = v_usuario_existente_id
            RETURNING id INTO v_inserted_id;

            -- Registrar en auditorÃƒÆ’Ã‚Â­a la reactivaciÃƒÆ’Ã‚Â³n
            INSERT INTO logs_auditoria (evento, actor_usuario, usuario_afectado_id, detalles, timestamp)
            VALUES ('REINSCRIPCION_USUARIO_REACTIVADO', 'SISTEMA', v_inserted_id, 
                    json_build_object('dni', p_dni_pasaporte, 'evento_id', v_evento_id, 'nuevo_estado', v_estado_codigo)::jsonb, NOW());
        ELSE
            -- Ya existe activo en este evento
            RAISE EXCEPTION 'ERR_DNI_ALREADY_EXISTS: El DNI ya se encuentra registrado para este evento.'
                USING ERRCODE = '23505';
        END IF;
    ELSE
        -- InserciÃƒÆ’Ã‚Â³n limpia de nueva persona/inscripciÃƒÆ’Ã‚Â³n en el evento
        INSERT INTO usuarios (
            dni_pasaporte, nombre, apellido, email, celular,
            rol_principal_id, estado_inscripcion_id, foto_url, foto_metadata, evento_id
        ) VALUES (
            p_dni_pasaporte, p_nombre, p_apellido, p_email, p_celular,
            p_rol_principal_id, v_estado_id, p_foto_url, p_foto_metadata, v_evento_id
        ) RETURNING id INTO v_inserted_id;
    END IF;

    -- Si el rol principal es 'Expositor', inicializar homologaciÃƒÆ’Ã‚Â³n si no existe
    IF EXISTS (SELECT 1 FROM roles WHERE id = p_rol_principal_id AND nombre = 'Expositor') THEN
        INSERT INTO homologaciones_expositores (usuario_id, estado_homologacion)
        VALUES (v_inserted_id, 'PENDIENTE')
        ON CONFLICT (usuario_id) DO NOTHING;
    END IF;

    RETURN QUERY SELECT v_inserted_id, v_estado_codigo;
END;
$$;


ALTER FUNCTION public.registrar_usuario_seguro(p_dni_pasaporte character varying, p_nombre character varying, p_apellido character varying, p_email character varying, p_celular character varying, p_rol_principal_id integer, p_foto_url text, p_foto_metadata jsonb, p_es_superadmin_override boolean, p_evento_id integer) OWNER TO congreso_app;

--
-- Name: trg_check_blacklist(); Type: FUNCTION; Schema: public; Owner: congreso_app
--

CREATE FUNCTION public.trg_check_blacklist() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_sancionado INT;
BEGIN
    -- Si la sesiÃƒÆ’Ã‚Â³n tiene superadmin_override activo en transacciÃƒÆ’Ã‚Â³n, permitir
    IF current_setting('app.superadmin_override', true) = 'true' THEN
        RETURN NEW;
    END IF;

    IF EXISTS (SELECT 1 FROM blacklist WHERE dni_pasaporte = NEW.dni_pasaporte AND activo = TRUE) THEN
        SELECT id INTO v_id_sancionado FROM estados_inscripcion WHERE codigo = 'SANCIONADO';
        NEW.estado_inscripcion_id := v_id_sancionado;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_check_blacklist() OWNER TO congreso_app;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: acreditaciones; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.acreditaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    operador_id integer NOT NULL,
    tipo_acreditacion_id integer NOT NULL,
    actividad_id integer,
    punto_acceso_id integer NOT NULL,
    es_manual boolean DEFAULT false NOT NULL,
    motivo_manual text,
    tipo_movimiento character varying(20) DEFAULT 'INGRESO'::character varying NOT NULL,
    timestamp_acreditacion timestamp with time zone DEFAULT now(),
    CONSTRAINT acreditaciones_tipo_movimiento_check CHECK (((tipo_movimiento)::text = ANY ((ARRAY['INGRESO'::character varying, 'EGRESO'::character varying])::text[])))
);


ALTER TABLE public.acreditaciones OWNER TO congreso_app;

--
-- Name: actividades; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.actividades (
    id integer NOT NULL,
    evento_id integer,
    nombre character varying(150) NOT NULL,
    descripcion text,
    tipo_acreditacion_id integer NOT NULL,
    punto_acceso_id integer NOT NULL,
    cupo_maximo integer DEFAULT 50 NOT NULL,
    horario_inicio timestamp with time zone NOT NULL,
    horario_fin timestamp with time zone NOT NULL,
    disertante_nombre character varying(150),
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.actividades OWNER TO congreso_app;

--
-- Name: actividades_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.actividades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actividades_id_seq OWNER TO congreso_app;

--
-- Name: actividades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.actividades_id_seq OWNED BY public.actividades.id;


--
-- Name: blacklist; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.blacklist (
    id integer NOT NULL,
    dni_pasaporte character varying(50) NOT NULL,
    motivo text NOT NULL,
    registrado_por character varying(100) DEFAULT 'SISTEMA'::character varying,
    registrado_en timestamp with time zone DEFAULT now(),
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.blacklist OWNER TO congreso_app;

--
-- Name: blacklist_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.blacklist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blacklist_id_seq OWNER TO congreso_app;

--
-- Name: blacklist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.blacklist_id_seq OWNED BY public.blacklist.id;


--
-- Name: categorias_tematicas; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.categorias_tematicas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.categorias_tematicas OWNER TO congreso_app;

--
-- Name: categorias_tematicas_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.categorias_tematicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_tematicas_id_seq OWNER TO congreso_app;

--
-- Name: categorias_tematicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.categorias_tematicas_id_seq OWNED BY public.categorias_tematicas.id;


--
-- Name: certificados; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.certificados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_verificacion character varying(50) NOT NULL,
    usuario_id uuid NOT NULL,
    evento_id integer DEFAULT 1,
    tipo_certificado character varying(50) DEFAULT 'ASISTENCIA'::character varying NOT NULL,
    horas_catedra integer DEFAULT 16 NOT NULL,
    emitido_en timestamp with time zone DEFAULT now(),
    metadata jsonb,
    CONSTRAINT certificados_tipo_certificado_check CHECK (((tipo_certificado)::text = ANY ((ARRAY['ASISTENCIA'::character varying, 'EXPOSITOR'::character varying, 'DISERTANTE'::character varying, 'ORGANIZADOR'::character varying])::text[])))
);


ALTER TABLE public.certificados OWNER TO congreso_app;

--
-- Name: configuraciones_sistema; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.configuraciones_sistema (
    clave character varying(100) NOT NULL,
    valor jsonb NOT NULL,
    descripcion text,
    categoria character varying(50) DEFAULT 'GENERAL'::character varying,
    actualizado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.configuraciones_sistema OWNER TO congreso_app;

--
-- Name: confirmaciones_asistencia; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.confirmaciones_asistencia (
    id integer NOT NULL,
    usuario_id uuid NOT NULL,
    token_hash character varying(128) NOT NULL,
    emitido_en timestamp with time zone DEFAULT now(),
    expira_en timestamp with time zone NOT NULL,
    confirmado_en timestamp with time zone,
    ip_confirmacion character varying(45)
);


ALTER TABLE public.confirmaciones_asistencia OWNER TO congreso_app;

--
-- Name: confirmaciones_asistencia_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.confirmaciones_asistencia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.confirmaciones_asistencia_id_seq OWNER TO congreso_app;

--
-- Name: confirmaciones_asistencia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.confirmaciones_asistencia_id_seq OWNED BY public.confirmaciones_asistencia.id;


--
-- Name: encuesta_opciones; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.encuesta_opciones (
    id integer NOT NULL,
    pregunta_id integer NOT NULL,
    categoria_tematica_id integer,
    orden integer DEFAULT 1 NOT NULL,
    texto_opcion character varying(250) NOT NULL,
    valor_ponderacion numeric(4,2) DEFAULT 1.00 NOT NULL
);


ALTER TABLE public.encuesta_opciones OWNER TO congreso_app;

--
-- Name: encuesta_opciones_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.encuesta_opciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.encuesta_opciones_id_seq OWNER TO congreso_app;

--
-- Name: encuesta_opciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.encuesta_opciones_id_seq OWNED BY public.encuesta_opciones.id;


--
-- Name: encuesta_preguntas; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.encuesta_preguntas (
    id integer NOT NULL,
    encuesta_id integer NOT NULL,
    categoria_tematica_id integer,
    orden integer DEFAULT 1 NOT NULL,
    texto_pregunta text NOT NULL,
    tipo_pregunta character varying(50) DEFAULT 'OPCION_MULTIPLE'::character varying NOT NULL,
    es_obligatoria boolean DEFAULT false NOT NULL,
    peso_ponderacion numeric(4,2) DEFAULT 1.00 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    CONSTRAINT encuesta_preguntas_tipo_pregunta_check CHECK (((tipo_pregunta)::text = ANY ((ARRAY['OPCION_UNICA'::character varying, 'OPCION_MULTIPLE'::character varying, 'CALIFICACION_1_A_5'::character varying, 'TEXTO_ABIERTO'::character varying])::text[])))
);


ALTER TABLE public.encuesta_preguntas OWNER TO congreso_app;

--
-- Name: encuesta_preguntas_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.encuesta_preguntas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.encuesta_preguntas_id_seq OWNER TO congreso_app;

--
-- Name: encuesta_preguntas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.encuesta_preguntas_id_seq OWNED BY public.encuesta_preguntas.id;


--
-- Name: encuesta_respuestas; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.encuesta_respuestas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    encuesta_id integer NOT NULL,
    usuario_id uuid,
    rol_id integer,
    ip_origen character varying(45),
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.encuesta_respuestas OWNER TO congreso_app;

--
-- Name: encuesta_respuestas_detalles; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.encuesta_respuestas_detalles (
    id bigint NOT NULL,
    respuesta_id uuid NOT NULL,
    pregunta_id integer NOT NULL,
    opcion_id integer,
    categoria_tematica_id integer,
    valor_numerico integer,
    respuesta_texto text
);


ALTER TABLE public.encuesta_respuestas_detalles OWNER TO congreso_app;

--
-- Name: encuesta_respuestas_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.encuesta_respuestas_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.encuesta_respuestas_detalles_id_seq OWNER TO congreso_app;

--
-- Name: encuesta_respuestas_detalles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.encuesta_respuestas_detalles_id_seq OWNED BY public.encuesta_respuestas_detalles.id;


--
-- Name: encuestas; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.encuestas (
    id integer NOT NULL,
    evento_id integer,
    titulo character varying(150) NOT NULL,
    descripcion text,
    etapa character varying(50) DEFAULT 'INSCRIPCION'::character varying NOT NULL,
    es_obligatoria boolean DEFAULT false NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now(),
    actualizado_en timestamp with time zone DEFAULT now(),
    CONSTRAINT encuestas_etapa_check CHECK (((etapa)::text = ANY ((ARRAY['INSCRIPCION'::character varying, 'CONFIRMACION'::character varying, 'ACREDITACION'::character varying, 'POST_EVENTO'::character varying, 'SONDEO_ABIERTO'::character varying])::text[])))
);


ALTER TABLE public.encuestas OWNER TO congreso_app;

--
-- Name: encuestas_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.encuestas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.encuestas_id_seq OWNER TO congreso_app;

--
-- Name: encuestas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.encuestas_id_seq OWNED BY public.encuestas.id;


--
-- Name: estados_inscripcion; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.estados_inscripcion (
    id integer NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(50) NOT NULL,
    permite_ingreso boolean DEFAULT false NOT NULL,
    descripcion text
);


ALTER TABLE public.estados_inscripcion OWNER TO congreso_app;

--
-- Name: estados_inscripcion_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.estados_inscripcion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estados_inscripcion_id_seq OWNER TO congreso_app;

--
-- Name: estados_inscripcion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.estados_inscripcion_id_seq OWNED BY public.estados_inscripcion.id;


--
-- Name: eventos; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.eventos (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(150) NOT NULL,
    lema character varying(250),
    descripcion text,
    anio integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    horario_apertura character varying(10) DEFAULT '08:00'::character varying,
    horario_cierre character varying(10) DEFAULT '18:30'::character varying,
    lugar_nombre character varying(150),
    direccion character varying(200),
    ciudad character varying(100),
    cupo_maximo integer DEFAULT 400 NOT NULL,
    estado character varying(30) DEFAULT 'PUBLICADO'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.eventos OWNER TO congreso_app;

--
-- Name: eventos_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.eventos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eventos_id_seq OWNER TO congreso_app;

--
-- Name: eventos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.eventos_id_seq OWNED BY public.eventos.id;


--
-- Name: homologaciones_expositores; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.homologaciones_expositores (
    id integer NOT NULL,
    usuario_id uuid NOT NULL,
    estado_homologacion character varying(30) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    documentacion_presentada text,
    observaciones text,
    funcionario_validador_id integer,
    fecha_validacion timestamp with time zone,
    funcionario_anulador_id integer,
    fecha_anulacion timestamp with time zone,
    motivo_anulacion text,
    actualizado_en timestamp with time zone DEFAULT now(),
    CONSTRAINT homologaciones_expositores_estado_homologacion_check CHECK (((estado_homologacion)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'VALIDADO'::character varying, 'RECHAZADO'::character varying, 'ANULADO'::character varying])::text[])))
);


ALTER TABLE public.homologaciones_expositores OWNER TO congreso_app;

--
-- Name: homologaciones_expositores_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.homologaciones_expositores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.homologaciones_expositores_id_seq OWNER TO congreso_app;

--
-- Name: homologaciones_expositores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.homologaciones_expositores_id_seq OWNED BY public.homologaciones_expositores.id;


--
-- Name: logs_auditoria; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.logs_auditoria (
    id bigint NOT NULL,
    evento character varying(100) NOT NULL,
    actor_usuario character varying(100) NOT NULL,
    usuario_afectado_id uuid,
    detalles jsonb,
    ip_origen character varying(45),
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.logs_auditoria OWNER TO congreso_app;

--
-- Name: logs_auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.logs_auditoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_auditoria_id_seq OWNER TO congreso_app;

--
-- Name: logs_auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.logs_auditoria_id_seq OWNED BY public.logs_auditoria.id;


--
-- Name: operadores; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.operadores (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email_institucional character varying(150) NOT NULL,
    punto_acceso_default_id integer NOT NULL,
    rol_id integer DEFAULT 5 NOT NULL,
    password_hash character varying(255),
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.operadores OWNER TO congreso_app;

--
-- Name: operadores_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.operadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operadores_id_seq OWNER TO congreso_app;

--
-- Name: operadores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.operadores_id_seq OWNED BY public.operadores.id;


--
-- Name: puntos_acceso; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.puntos_acceso (
    id integer NOT NULL,
    evento_id integer,
    nombre character varying(100) NOT NULL,
    ubicacion_fisica character varying(150) NOT NULL,
    tipo_punto character varying(30) DEFAULT 'PUESTO_ACCESO'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.puntos_acceso OWNER TO congreso_app;

--
-- Name: puntos_acceso_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.puntos_acceso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.puntos_acceso_id_seq OWNER TO congreso_app;

--
-- Name: puntos_acceso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.puntos_acceso_id_seq OWNED BY public.puntos_acceso.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text,
    jerarquia integer DEFAULT 1 NOT NULL,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO congreso_app;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO congreso_app;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: suscripciones_push; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.suscripciones_push (
    id integer NOT NULL,
    usuario_id uuid,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.suscripciones_push OWNER TO congreso_app;

--
-- Name: suscripciones_push_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.suscripciones_push_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suscripciones_push_id_seq OWNER TO congreso_app;

--
-- Name: suscripciones_push_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.suscripciones_push_id_seq OWNED BY public.suscripciones_push.id;


--
-- Name: tipos_acreditacion; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.tipos_acreditacion (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    descripcion character varying(150) NOT NULL,
    requiere_actividad boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tipos_acreditacion OWNER TO congreso_app;

--
-- Name: tipos_acreditacion_id_seq; Type: SEQUENCE; Schema: public; Owner: congreso_app
--

CREATE SEQUENCE public.tipos_acreditacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_acreditacion_id_seq OWNER TO congreso_app;

--
-- Name: tipos_acreditacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: congreso_app
--

ALTER SEQUENCE public.tipos_acreditacion_id_seq OWNED BY public.tipos_acreditacion.id;


--
-- Name: usuario_roles_adicionales; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.usuario_roles_adicionales (
    usuario_id uuid NOT NULL,
    rol_id integer NOT NULL,
    asignado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.usuario_roles_adicionales OWNER TO congreso_app;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: congreso_app
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dni_pasaporte character varying(50) NOT NULL,
    evento_id integer DEFAULT 1 NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    celular character varying(30) NOT NULL,
    rol_principal_id integer NOT NULL,
    estado_inscripcion_id integer NOT NULL,
    foto_url text,
    foto_metadata jsonb,
    creado_en timestamp with time zone DEFAULT now(),
    actualizado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.usuarios OWNER TO congreso_app;

--
-- Name: actividades id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.actividades ALTER COLUMN id SET DEFAULT nextval('public.actividades_id_seq'::regclass);


--
-- Name: blacklist id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.blacklist ALTER COLUMN id SET DEFAULT nextval('public.blacklist_id_seq'::regclass);


--
-- Name: categorias_tematicas id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.categorias_tematicas ALTER COLUMN id SET DEFAULT nextval('public.categorias_tematicas_id_seq'::regclass);


--
-- Name: confirmaciones_asistencia id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.confirmaciones_asistencia ALTER COLUMN id SET DEFAULT nextval('public.confirmaciones_asistencia_id_seq'::regclass);


--
-- Name: encuesta_opciones id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_opciones ALTER COLUMN id SET DEFAULT nextval('public.encuesta_opciones_id_seq'::regclass);


--
-- Name: encuesta_preguntas id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_preguntas ALTER COLUMN id SET DEFAULT nextval('public.encuesta_preguntas_id_seq'::regclass);


--
-- Name: encuesta_respuestas_detalles id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_respuestas_detalles ALTER COLUMN id SET DEFAULT nextval('public.encuesta_respuestas_detalles_id_seq'::regclass);


--
-- Name: encuestas id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuestas ALTER COLUMN id SET DEFAULT nextval('public.encuestas_id_seq'::regclass);


--
-- Name: estados_inscripcion id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.estados_inscripcion ALTER COLUMN id SET DEFAULT nextval('public.estados_inscripcion_id_seq'::regclass);


--
-- Name: eventos id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.eventos ALTER COLUMN id SET DEFAULT nextval('public.eventos_id_seq'::regclass);


--
-- Name: homologaciones_expositores id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.homologaciones_expositores ALTER COLUMN id SET DEFAULT nextval('public.homologaciones_expositores_id_seq'::regclass);


--
-- Name: logs_auditoria id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.logs_auditoria ALTER COLUMN id SET DEFAULT nextval('public.logs_auditoria_id_seq'::regclass);


--
-- Name: operadores id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.operadores ALTER COLUMN id SET DEFAULT nextval('public.operadores_id_seq'::regclass);


--
-- Name: puntos_acceso id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.puntos_acceso ALTER COLUMN id SET DEFAULT nextval('public.puntos_acceso_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: suscripciones_push id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.suscripciones_push ALTER COLUMN id SET DEFAULT nextval('public.suscripciones_push_id_seq'::regclass);


--
-- Name: tipos_acreditacion id; Type: DEFAULT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.tipos_acreditacion ALTER COLUMN id SET DEFAULT nextval('public.tipos_acreditacion_id_seq'::regclass);


--
-- Data for Name: acreditaciones; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.acreditaciones (id, usuario_id, operador_id, tipo_acreditacion_id, actividad_id, punto_acceso_id, es_manual, motivo_manual, tipo_movimiento, timestamp_acreditacion) FROM stdin;
\.


--
-- Data for Name: actividades; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.actividades (id, evento_id, nombre, descripcion, tipo_acreditacion_id, punto_acceso_id, cupo_maximo, horario_inicio, horario_fin, disertante_nombre, activo) FROM stdin;
1	1	AcreditaciÃ³n General y CafÃ© de Bienvenida	RecepciÃ³n de asistentes, entrega de credenciales y cafÃ© de bienvenida institucional	1	1	500	2026-11-06 08:30:00-03	2026-11-06 09:30:00-03	Personal de AcreditaciÃ³n DETS	t
2	1	Apertura Oficial y Conferencia Magistral	Acto de bienvenida y apertura institucional	1	3	400	2026-11-06 09:30:00-03	2026-11-06 10:30:00-03	Autoridades DETS y Ministerio	t
3	1	Taller Hands-on: Ciberseguridad Defensiva	PrÃ¡cticas de hardening y respuesta a incidentes en entornos educativos	3	6	35	2026-11-06 11:00:00-03	2026-11-06 13:00:00-03	Ing. Marcos BenÃ­tez	t
4	1	Panel: Inteligencia Artificial en la FormaciÃ³n TÃ©cnica	DesafÃ­os curriculares y adopciÃ³n en IFTS	2	5	60	2026-11-06 14:00:00-03	2026-11-06 16:00:00-03	Lic. Valeria Rossi	t
5	1	Masterclass: Arquitecturas Cloud y DevOps	DiseÃ±o de aplicaciones escalables modernas	4	3	120	2026-11-06 16:30:00-03	2026-11-06 18:00:00-03	Dr. Esteban Guida	t
6	1	Mesa de Debate: InserciÃ³n Laboral y PrÃ¡cticas Profesionalizantes en IFTS	ArticulaciÃ³n entre institutos tÃ©cnicos y el sector productivo tecnolÃ³gico	2	4	100	2026-11-06 16:45:00-03	2026-11-06 18:00:00-03	Directivos de IFTS y CÃ¡maras TecnolÃ³gicas	t
\.


--
-- Data for Name: blacklist; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.blacklist (id, dni_pasaporte, motivo, registrado_por, registrado_en, activo) FROM stdin;
\.


--
-- Data for Name: categorias_tematicas; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.categorias_tematicas (id, nombre, descripcion, activo, creado_en) FROM stdin;
1	Inteligencia Artificial y Machine Learning	Modelos generativos, agentes y automatizaciÃ³n inteligente	t	2026-09-26 17:09:28.448878-03
2	Ciberseguridad y ProtecciÃ³n de Datos	Defensa de infraestructuras, normativas y forensia digital	t	2026-09-26 17:09:28.448878-03
3	Desarrollo Cloud y Arquitecturas Web	Sistemas distribuidos, microservicios, DevOps y APIs	t	2026-09-26 17:09:28.448878-03
4	RobÃ³tica, AutomatizaciÃ³n e IoT	Sistemas embebidos, sensores y robÃ³tica aplicada	t	2026-09-26 17:09:28.448878-03
5	InserciÃ³n Laboral y PrÃ¡cticas IFTS	PasantÃ­as, articulaciÃ³n con cÃ¡maras empresariales y mentorÃ­as	t	2026-09-26 17:09:28.448878-03
6	Ciencia de Datos y AnalÃ­tica	Big data, visualizaciÃ³n estratÃ©gica y pipelines de datos	t	2026-09-26 17:09:28.448878-03
\.


--
-- Data for Name: certificados; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.certificados (id, codigo_verificacion, usuario_id, evento_id, tipo_certificado, horas_catedra, emitido_en, metadata) FROM stdin;
\.


--
-- Data for Name: configuraciones_sistema; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en) FROM stdin;
aforo_maximo_confirmados	{"cupo": 400}	LÃ­mite mÃ¡ximo de inscripciones confirmadas automÃ¡ticas	GENERAL	2026-09-26 17:09:28.431841-03
ventana_reconfirmacion_horas	{"pre_evento_horas": 48, "vigencia_token_horas": 24}	Plazos para el envÃ­o de correos de confirmaciÃ³n y expiraciÃ³n	GENERAL	2026-09-26 17:09:28.431841-03
cron_backup_automatico	{"activo": true, "directorio": "./backups", "diurno_fin": "19:00", "frecuencia": "0 2 * * *", "diurno_activo": true, "diurno_inicio": "08:00", "nocturno_hora": "02:00", "retencion_dias": 15, "nocturno_activo": true, "diurno_intervalo_min": 30}	ProgramaciÃ³n y retenciÃ³n de backups automÃ¡ticos	BACKUP	2026-09-26 17:09:28.431841-03
repositorio_git	{"remoto_url": "", "ruta_local": "/media/nestor/960GB/GIT_Congreso/", "rama_default": "main", "sincronizacion_automatica": false}	ParÃ¡metros del repositorio Git local y sincronizaciÃ³n con remoto	GIT	2026-09-26 17:09:28.431841-03
politica_acreditacion	{"exigir_dni_fisico": true, "mostrar_foto_operador": true, "reloj_animado_credencial": true}	PolÃ­ticas de seguridad operativa en puerta	SEGURIDAD	2026-09-26 17:09:28.431841-03
\.


--
-- Data for Name: confirmaciones_asistencia; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.confirmaciones_asistencia (id, usuario_id, token_hash, emitido_en, expira_en, confirmado_en, ip_confirmacion) FROM stdin;
1	4eca7c7e-3bcd-4472-ac6b-9581972e2026	3130d4d38ae627157e4d333808cf5c37dd007a70de014e2602a8a60ef91caf8f	2026-09-26 17:50:58.421469-03	2026-09-27 17:50:58.419-03	\N	\N
2	1d86c6f9-8b81-4cc2-a652-74e40f162392	40fa31388a09be42e12c8a4445110a4609cac8a2a81c44040b07d789c99e1e91	2026-09-26 17:50:58.428214-03	2026-09-27 17:50:58.419-03	\N	\N
3	ffcb9b9d-607b-45fd-a0c6-223d2d8bfb70	8a6e585b786173d49b55a68afc99b8e9a701967580ff6632b3d6212b49440654	2026-09-26 17:50:58.43316-03	2026-09-27 17:50:58.419-03	\N	\N
4	4eca7c7e-3bcd-4472-ac6b-9581972e2026	ed0938ceef9dbe5e64c62786b6d89e4c1a2202049fcb60593765311fe599e175	2026-09-26 20:20:24.121429-03	2026-09-27 20:20:24.12-03	\N	\N
5	1d86c6f9-8b81-4cc2-a652-74e40f162392	6da00f4821b5b6d8742d20c13671c99d8a580f149d5ea9a7691a2bfdbbbccba7	2026-09-26 20:20:24.133562-03	2026-09-27 20:20:24.12-03	\N	\N
6	ffcb9b9d-607b-45fd-a0c6-223d2d8bfb70	2a42012bb70339f7e3562a2156dd27054d7a63263994bc51231d09328cf36640	2026-09-26 20:20:24.139518-03	2026-09-27 20:20:24.12-03	\N	\N
\.


--
-- Data for Name: encuesta_opciones; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.encuesta_opciones (id, pregunta_id, categoria_tematica_id, orden, texto_opcion, valor_ponderacion) FROM stdin;
1	1	1	1	Inteligencia Artificial y Modelos Predictivos	1.00
2	1	2	2	Ciberseguridad Ofensiva y Defensiva	1.00
3	1	3	3	Desarrollo Cloud & Microservicios	1.00
4	1	4	4	RobÃ³tica e Internet de las Cosas (IoT)	1.00
5	1	5	5	PrÃ¡cticas Profesionalizantes e InserciÃ³n en Empresas	1.00
\.


--
-- Data for Name: encuesta_preguntas; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.encuesta_preguntas (id, encuesta_id, categoria_tematica_id, orden, texto_pregunta, tipo_pregunta, es_obligatoria, peso_ponderacion, activo) FROM stdin;
1	1	\N	1	Â¿CuÃ¡les de las siguientes Ã¡reas tÃ©cnicas consideras fundamentales para tu desarrollo profesional?	OPCION_MULTIPLE	t	1.20	t
2	1	\N	2	Â¿QuÃ© nivel de interÃ©s tienes en profundizar sobre Inteligencia Artificial aplicada en la industria?	CALIFICACION_1_A_5	f	1.00	t
3	1	\N	3	Â¿QuÃ© temÃ¡tica o taller especÃ­fico te gustarÃ­a que se incorpore en la prÃ³xima ediciÃ³n?	TEXTO_ABIERTO	f	1.00	t
\.


--
-- Data for Name: encuesta_respuestas; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.encuesta_respuestas (id, encuesta_id, usuario_id, rol_id, ip_origen, creado_en) FROM stdin;
\.


--
-- Data for Name: encuesta_respuestas_detalles; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.encuesta_respuestas_detalles (id, respuesta_id, pregunta_id, opcion_id, categoria_tematica_id, valor_numerico, respuesta_texto) FROM stdin;
\.


--
-- Data for Name: encuestas; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.encuestas (id, evento_id, titulo, descripcion, etapa, es_obligatoria, activa, creado_en, actualizado_en) FROM stdin;
1	1	Sondeo de Intereses y Preferencias TemÃ¡ticas ETS 2026/2027	AyÃºdanos a priorizar los prÃ³ximos talleres, masterclasses y disertaciones tÃ©cnicas.	INSCRIPCION	f	t	2026-09-26 17:09:28.457112-03	2026-09-26 17:09:28.457112-03
\.


--
-- Data for Name: estados_inscripcion; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.estados_inscripcion (id, codigo, nombre, permite_ingreso, descripcion) FROM stdin;
1	CONFIRMADO	Confirmado	t	InscripciÃ³n activa con cupo asegurado y credencial habilitada
2	LISTA_ESPERA	Lista de Espera	f	Sin cupo inmediato por capacidad de aforo completada (FIFO)
3	SANCIONADO	Sancionado	f	RestricciÃ³n disciplinaria activa por inclusiÃ³n en Lista Negra / Blacklist
4	BAJA_AUTOMATICA	Baja AutomÃ¡tica 48hs	f	No confirmÃ³ asistencia en la ventana de 24hs tras el aviso de 48hs
5	CANCELADO	Cancelado	f	Baja voluntaria o revocada manualmente
\.


--
-- Data for Name: eventos; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.eventos (id, codigo, nombre, lema, descripcion, anio, fecha_inicio, fecha_fin, horario_apertura, horario_cierre, lugar_nombre, direccion, ciudad, cupo_maximo, estado, activo, creado_en) FROM stdin;
1	ETS_2026	1er Congreso de EducaciÃ³n TÃ©cnica Superior 2026	\N	EdiciÃ³n inaugural en Auditorio Polo Saavedra	2026	2026-11-06	2026-11-06	08:00	18:30	\N	\N	\N	400	PUBLICADO	t	2026-09-26 17:09:28.437265-03
2	ETS_2027	2do Congreso de EducaciÃ³n TÃ©cnica Superior 2027	\N	EdiciÃ³n de consolidaciÃ³n y nuevas especialidades	2027	2027-11-05	2027-11-05	08:00	18:30	\N	\N	\N	400	PUBLICADO	t	2026-09-26 17:09:28.437265-03
\.


--
-- Data for Name: homologaciones_expositores; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.homologaciones_expositores (id, usuario_id, estado_homologacion, documentacion_presentada, observaciones, funcionario_validador_id, fecha_validacion, funcionario_anulador_id, fecha_anulacion, motivo_anulacion, actualizado_en) FROM stdin;
1	1d86c6f9-8b81-4cc2-a652-74e40f162392	PENDIENTE	\N	\N	\N	\N	\N	\N	\N	2026-09-26 17:30:37.888841-03
2	ffcb9b9d-607b-45fd-a0c6-223d2d8bfb70	PENDIENTE	\N	\N	\N	\N	\N	\N	\N	2026-09-26 17:32:57.026844-03
\.


--
-- Data for Name: logs_auditoria; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.logs_auditoria (id, evento, actor_usuario, usuario_afectado_id, detalles, ip_origen, "timestamp") FROM stdin;
1	DESPACHO_CORREO_SANDBOX	SISTEMA_MAIL	\N	{"to": "luisojeda2014@gmail.com", "subject": "¡Inscripción Confirmada! Credencial de Acceso – Congreso ETS 2026", "messageId": "sandbox_1790454211630_ma59403", "simulated": true}	\N	2026-09-26 17:23:31.632254-03
2	DESPACHO_CORREO_SANDBOX	SISTEMA_MAIL	\N	{"to": "marazzitaoriana@gmail.com", "subject": "¡Inscripción Confirmada! Credencial de Acceso – Congreso ETS 2026", "messageId": "sandbox_1790454638273_1kqskod", "simulated": true}	\N	2026-09-26 17:30:38.273948-03
3	DESPACHO_CORREO_SANDBOX	SISTEMA_MAIL	\N	{"to": "fuentesnoelia.v@gmail.com", "subject": "¡Inscripción Confirmada! Credencial de Acceso – Congreso ETS 2026", "messageId": "sandbox_1790454777349_dhyuif0", "simulated": true}	\N	2026-09-26 17:32:57.35055-03
4	BAJA_AUTOMATICA_48HS	CRON_SISTEMA	\N	{"evento_id": 1, "bajas_count": 0}	\N	2026-09-26 17:50:58.357335-03
5	DESPACHO_CORREO_SANDBOX	SISTEMA_MAIL	\N	{"to": "luisojeda2014@gmail.com", "subject": "URGENTE: Reconfirmación de Asistencia (48hs previas) – Congreso ETS 2026", "messageId": "sandbox_1790455858425_wdh3y4r", "simulated": true}	\N	2026-09-26 17:50:58.426909-03
6	DESPACHO_CORREO_SANDBOX	SISTEMA_MAIL	\N	{"to": "marazzitaoriana@gmail.com", "subject": "URGENTE: Reconfirmación de Asistencia (48hs previas) – Congreso ETS 2026", "messageId": "sandbox_1790455858430_20qko09", "simulated": true}	\N	2026-09-26 17:50:58.431599-03
7	DESPACHO_CORREO_SANDBOX	SISTEMA_MAIL	\N	{"to": "fuentesnoelia.v@gmail.com", "subject": "URGENTE: Reconfirmación de Asistencia (48hs previas) – Congreso ETS 2026", "messageId": "sandbox_1790455858436_y8wizph", "simulated": true}	\N	2026-09-26 17:50:58.437837-03
8	CRON_48HS_DESPACHADO	SISTEMA	\N	{"lotes": 1, "evento_id": 1, "total_confirmados": 3}	\N	2026-09-26 17:50:58.439536-03
9	BACKUP_AUTOMATICO_GENERADO	CRON_PROGRAMADO_DIARIO	\N	{"sha256": "f695438d43be96c84f76fdd2f41214ad1911759ceb53da6684eec39cb0ccd37a", "esManual": false, "filename": "backup_ets2026_2026-09-26T20-50-58-443Z_auto.zip", "filepath": "C:\\\\Users\\\\usuario\\\\Desktop\\\\Congreso_Test\\\\backend\\\\backups\\\\backup_ets2026_2026-09-26T20-50-58-443Z_auto.zip", "createdAt": "2026-09-26T20:50:59.001Z", "dumps_sql": ["dumps/dump_completo.sql", "dumps/dump_operacion.sql", "dumps/dump_configuracion.sql", "dumps/dump_usuarios.sql"], "sizeBytes": 24912, "totalRegistros": 75, "tablasExportadas": ["usuarios", "operadores", "usuario_roles_adicionales", "blacklist", "suscripciones_push", "configuraciones_sistema", "eventos", "roles", "estados_inscripcion", "tipos_acreditacion", "puntos_acceso", "categorias_tematicas", "catalogo_actividades", "actividades", "encuestas", "encuesta_preguntas", "encuesta_opciones", "acreditaciones", "actividad_inscripciones", "confirmaciones_asistencia", "certificados", "encuesta_respuestas", "encuesta_respuestas_detalles", "homologaciones_expositores", "logs_auditoria"], "separacion_modulos": {"usuarios": {"tablas": ["usuarios", "operadores", "usuario_roles_adicionales", "blacklist", "suscripciones_push"], "archivo": "usuarios/datos_usuarios.json", "total_registros": 10}, "operacion": {"tablas": ["acreditaciones", "actividad_inscripciones", "confirmaciones_asistencia", "certificados", "encuesta_respuestas", "encuesta_respuestas_detalles", "homologaciones_expositores", "logs_auditoria"], "archivo": "operacion/datos_operacion.json", "total_registros": 13}, "configuracion": {"tablas": ["configuraciones_sistema", "eventos", "roles", "estados_inscripcion", "tipos_acreditacion", "puntos_acceso", "categorias_tematicas", "catalogo_actividades", "actividades", "encuestas", "encuesta_preguntas", "encuesta_opciones"], "archivo": "configuracion/datos_configuracion.json", "total_registros": 52}}}	\N	2026-09-26 17:50:59.00242-03
10	CRON_CYCLE_COMPLETED	CRON_SCHEDULER	\N	{"duracion_ms": 755, "notificados": 3, "bajas_aplicadas": 0, "promociones_fifo": 0}	\N	2026-09-26 17:50:59.00889-03
11	BAJA_AUTOMATICA_48HS	CRON_SISTEMA	\N	{"evento_id": 1, "bajas_count": 0}	\N	2026-09-26 20:20:24.034475-03
12	DESPACHO_CORREO_SANDBOX	SISTEMA_MAIL	\N	{"to": "luisojeda2014@gmail.com", "subject": "URGENTE: Reconfirmación de Asistencia (48hs previas) – Congreso ETS 2026", "messageId": "sandbox_1790464824131_vg5koyt", "simulated": true}	\N	2026-09-26 20:20:24.131961-03
13	DESPACHO_CORREO_SANDBOX	SISTEMA_MAIL	\N	{"to": "marazzitaoriana@gmail.com", "subject": "URGENTE: Reconfirmación de Asistencia (48hs previas) – Congreso ETS 2026", "messageId": "sandbox_1790464824136_3oe9nqx", "simulated": true}	\N	2026-09-26 20:20:24.137514-03
14	DESPACHO_CORREO_SANDBOX	SISTEMA_MAIL	\N	{"to": "fuentesnoelia.v@gmail.com", "subject": "URGENTE: Reconfirmación de Asistencia (48hs previas) – Congreso ETS 2026", "messageId": "sandbox_1790464824144_93oda18", "simulated": true}	\N	2026-09-26 20:20:24.145044-03
15	CRON_48HS_DESPACHADO	SISTEMA	\N	{"lotes": 1, "evento_id": 1, "total_confirmados": 3}	\N	2026-09-26 20:20:24.146635-03
16	BACKUP_AUTOMATICO_GENERADO	CRON_PROGRAMADO_DIARIO	\N	{"sha256": "ce5291cfff46e84cd1005dea9464add93156a4f00903dfe4020dd3b581e969c4", "esManual": false, "filename": "backup_ets2026_2026-09-26T23-20-24-150Z_auto.zip", "filepath": "C:\\\\Users\\\\usuario\\\\Desktop\\\\Congreso_Test\\\\backend\\\\backups\\\\backup_ets2026_2026-09-26T23-20-24-150Z_auto.zip", "createdAt": "2026-09-26T23:20:24.589Z", "dumps_sql": ["dumps/dump_completo.sql", "dumps/dump_operacion.sql", "dumps/dump_configuracion.sql", "dumps/dump_usuarios.sql"], "sizeBytes": 27843, "totalRegistros": 85, "tablasExportadas": ["usuarios", "operadores", "usuario_roles_adicionales", "blacklist", "suscripciones_push", "configuraciones_sistema", "eventos", "roles", "estados_inscripcion", "tipos_acreditacion", "puntos_acceso", "categorias_tematicas", "catalogo_actividades", "actividades", "encuestas", "encuesta_preguntas", "encuesta_opciones", "acreditaciones", "actividad_inscripciones", "confirmaciones_asistencia", "certificados", "encuesta_respuestas", "encuesta_respuestas_detalles", "homologaciones_expositores", "logs_auditoria"], "separacion_modulos": {"usuarios": {"tablas": ["usuarios", "operadores", "usuario_roles_adicionales", "blacklist", "suscripciones_push"], "archivo": "usuarios/datos_usuarios.json", "total_registros": 10}, "operacion": {"tablas": ["acreditaciones", "actividad_inscripciones", "confirmaciones_asistencia", "certificados", "encuesta_respuestas", "encuesta_respuestas_detalles", "homologaciones_expositores", "logs_auditoria"], "archivo": "operacion/datos_operacion.json", "total_registros": 23}, "configuracion": {"tablas": ["configuraciones_sistema", "eventos", "roles", "estados_inscripcion", "tipos_acreditacion", "puntos_acceso", "categorias_tematicas", "catalogo_actividades", "actividades", "encuestas", "encuesta_preguntas", "encuesta_opciones"], "archivo": "configuracion/datos_configuracion.json", "total_registros": 52}}}	\N	2026-09-26 20:20:24.590238-03
17	CRON_CYCLE_COMPLETED	CRON_SCHEDULER	\N	{"duracion_ms": 678, "notificados": 3, "bajas_aplicadas": 0, "promociones_fifo": 0}	\N	2026-09-26 20:20:24.596297-03
\.


--
-- Data for Name: operadores; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.operadores (id, nombre, apellido, email_institucional, punto_acceso_default_id, rol_id, password_hash, activo, creado_en) FROM stdin;
1	Operador 1	Puerta Principal	operador1.puerta@bue.edu.ar	1	5	519a19591492bc470768b209e257eb3c:d947231ce81bfbe779836371cb765f04230d70da6d892ba94a530eb6a5f54316d9a9f2ce5eec5926ec03ddc4a9a0d8bbecceba462f92a472c3d014bc9fa86178	t	2026-09-26 17:09:28.411019-03
2	Operador 2	Puerta Lateral	operador2.lateral@bue.edu.ar	2	5	519a19591492bc470768b209e257eb3c:d947231ce81bfbe779836371cb765f04230d70da6d892ba94a530eb6a5f54316d9a9f2ce5eec5926ec03ddc4a9a0d8bbecceba462f92a472c3d014bc9fa86178	t	2026-09-26 17:09:28.411019-03
3	Verificador	DETS Pergaminos	verificador.dets@bue.edu.ar	1	6	e8db685d65d095f87b8979b00ca36df2:82243d4c67676fb13437e408ec20584eb266cf17f041707ea24e930fbf0c8f5f8be0fec7d6a5ee5be602511414774338450125c192e4be0bbcf9b8ae2fe7e721	t	2026-09-26 17:09:28.411019-03
4	Administrador	General DETS	admin@ifts04.edu.ar	1	7	538c470bca95df46c04dce90b4d83bb3:a7bb8abcf659ac6c7a3cbdb35470359dfe93ab963a1ad458a810e58b90630c707279df9ae6d641c158fd45883fff51ccba64d260cd7b050453262e3f07178eeb	t	2026-09-26 17:09:28.411019-03
5	Superadmin	General	superadmin.congreso@bue.edu.ar	1	8	f8bb2219633e8e7d23d85836fae758a5:fe5e227091448b111dc54b1f49e49cb4a52ff37cffcf385b2ee50ba3ee27bb61c7414bc9697d812239f60f64beae89fa0821d3780369a4781498b3f6e1f0e4b8	t	2026-09-26 17:09:28.411019-03
\.


--
-- Data for Name: puntos_acceso; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.puntos_acceso (id, evento_id, nombre, ubicacion_fisica, tipo_punto, activo, creado_en) FROM stdin;
1	\N	Acceso General - Puerta Principal	Hall de Entrada Principal - PB	PUESTO_ACCESO	t	2026-09-26 17:09:28.398149-03
2	\N	Acceso General - Puerta Lateral	Acceso Rampa Accesible - PB	PUESTO_ACCESO	t	2026-09-26 17:09:28.398149-03
3	\N	Aula Magna - Auditorio Central	Auditorio Principal	PUESTO_ACCESO	t	2026-09-26 17:09:28.398149-03
4	\N	Aula 1 - RobÃ³tica y AutomatizaciÃ³n	Primer Piso - Sector Este	PUESTO_ACCESO	t	2026-09-26 17:09:28.398149-03
5	\N	Aula 2 - Inteligencia Artificial y Big Data	Primer Piso - Sector Oeste	PUESTO_ACCESO	t	2026-09-26 17:09:28.398149-03
6	\N	Taller 1 - Redes y Ciberseguridad	Subsuelo - Laboratorio A	PUESTO_ACCESO	t	2026-09-26 17:09:28.398149-03
7	\N	Taller 2 - Desarrollo Web y Cloud	Subsuelo - Laboratorio B	PUESTO_ACCESO	t	2026-09-26 17:09:28.398149-03
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.roles (id, nombre, descripcion, jerarquia, creado_en) FROM stdin;
1	Estudiante	Estudiante de Nivel TÃ©cnico Superior o afÃ­n	1	2026-09-26 17:09:28.382478-03
2	Docente	Personal acadÃ©mico / Docente	1	2026-09-26 17:09:28.382478-03
3	Expositor	Disertante o Tallerista con requerimiento de homologaciÃ³n	2	2026-09-26 17:09:28.382478-03
4	Autoridad	Autoridad Institucional / Ministerial / Invitado Especial	2	2026-09-26 17:09:28.382478-03
5	Operador	Personal de acreditaciÃ³n en puertas y aulas	3	2026-09-26 17:09:28.382478-03
6	Verificador	Funcionario habilitado para homologar pergaminos de expositores	4	2026-09-26 17:09:28.382478-03
7	Administrador	Personal directivo DETS para control y gestiÃ³n	4	2026-09-26 17:09:28.382478-03
8	Superadmin	Administrador total con facultades de sobrecupo y override	5	2026-09-26 17:09:28.382478-03
\.


--
-- Data for Name: suscripciones_push; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.suscripciones_push (id, usuario_id, endpoint, p256dh, auth, creado_en) FROM stdin;
\.


--
-- Data for Name: tipos_acreditacion; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.tipos_acreditacion (id, codigo, descripcion, requiere_actividad) FROM stdin;
1	ACCESO_GENERAL	Ingreso al predio del Auditorio Polo Saavedra	f
2	ACTIVIDAD_AULA	Ingreso a conferencia o panel en aula temÃ¡tica	t
3	TALLER	ParticipaciÃ³n en taller prÃ¡ctico con cupo limitado	t
4	MASTERCLASS	Clase magistral con expositor principal	t
\.


--
-- Data for Name: usuario_roles_adicionales; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.usuario_roles_adicionales (usuario_id, rol_id, asignado_en) FROM stdin;
1d86c6f9-8b81-4cc2-a652-74e40f162392	1	2026-09-26 17:30:37.922125-03
ffcb9b9d-607b-45fd-a0c6-223d2d8bfb70	3	2026-09-26 17:32:57.020782-03
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: congreso_app
--

COPY public.usuarios (id, dni_pasaporte, evento_id, nombre, apellido, email, celular, rol_principal_id, estado_inscripcion_id, foto_url, foto_metadata, creado_en, actualizado_en) FROM stdin;
4eca7c7e-3bcd-4472-ac6b-9581972e2026	18185452	1	Luis	Ojeda	luisojeda2014@gmail.com	1132009377	1	1	\N	{"consentimiento_ip": "::1", "consentimiento_fecha": "2026-09-26T20:23:31.576Z", "consentimiento_ley_25326": true}	2026-09-26 17:23:31.578372-03	2026-09-26 17:23:31.578372-03
1d86c6f9-8b81-4cc2-a652-74e40f162392	44100588	1	Oriana	Marazzita	marazzitaoriana@gmail.com	1132999316	3	1	\N	{"consentimiento_ip": "::1", "consentimiento_fecha": "2026-09-26T20:30:37.887Z", "consentimiento_ley_25326": true}	2026-09-26 17:30:37.888841-03	2026-09-26 17:30:37.888841-03
ffcb9b9d-607b-45fd-a0c6-223d2d8bfb70	43034475	1	Noelia	Fuentes	fuentesnoelia.v@gmail.com	1158519905	2	1	\N	{"consentimiento_ip": "::1", "consentimiento_fecha": "2026-09-26T20:32:56.992Z", "consentimiento_ley_25326": true}	2026-09-26 17:32:56.993413-03	2026-09-26 17:32:56.993413-03
\.


--
-- Name: actividades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.actividades_id_seq', 6, true);


--
-- Name: blacklist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.blacklist_id_seq', 1, false);


--
-- Name: categorias_tematicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.categorias_tematicas_id_seq', 6, true);


--
-- Name: confirmaciones_asistencia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.confirmaciones_asistencia_id_seq', 6, true);


--
-- Name: encuesta_opciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.encuesta_opciones_id_seq', 5, true);


--
-- Name: encuesta_preguntas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.encuesta_preguntas_id_seq', 3, true);


--
-- Name: encuesta_respuestas_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.encuesta_respuestas_detalles_id_seq', 1, false);


--
-- Name: encuestas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.encuestas_id_seq', 1, true);


--
-- Name: estados_inscripcion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.estados_inscripcion_id_seq', 5, true);


--
-- Name: eventos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.eventos_id_seq', 2, true);


--
-- Name: homologaciones_expositores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.homologaciones_expositores_id_seq', 2, true);


--
-- Name: logs_auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.logs_auditoria_id_seq', 17, true);


--
-- Name: operadores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.operadores_id_seq', 5, true);


--
-- Name: puntos_acceso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.puntos_acceso_id_seq', 7, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.roles_id_seq', 8, true);


--
-- Name: suscripciones_push_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.suscripciones_push_id_seq', 1, false);


--
-- Name: tipos_acreditacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: congreso_app
--

SELECT pg_catalog.setval('public.tipos_acreditacion_id_seq', 4, true);


--
-- Name: acreditaciones acreditaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.acreditaciones
    ADD CONSTRAINT acreditaciones_pkey PRIMARY KEY (id);


--
-- Name: actividades actividades_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_pkey PRIMARY KEY (id);


--
-- Name: blacklist blacklist_dni_pasaporte_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT blacklist_dni_pasaporte_key UNIQUE (dni_pasaporte);


--
-- Name: blacklist blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT blacklist_pkey PRIMARY KEY (id);


--
-- Name: categorias_tematicas categorias_tematicas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.categorias_tematicas
    ADD CONSTRAINT categorias_tematicas_nombre_key UNIQUE (nombre);


--
-- Name: categorias_tematicas categorias_tematicas_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.categorias_tematicas
    ADD CONSTRAINT categorias_tematicas_pkey PRIMARY KEY (id);


--
-- Name: certificados certificados_codigo_verificacion_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.certificados
    ADD CONSTRAINT certificados_codigo_verificacion_key UNIQUE (codigo_verificacion);


--
-- Name: certificados certificados_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.certificados
    ADD CONSTRAINT certificados_pkey PRIMARY KEY (id);


--
-- Name: configuraciones_sistema configuraciones_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.configuraciones_sistema
    ADD CONSTRAINT configuraciones_sistema_pkey PRIMARY KEY (clave);


--
-- Name: confirmaciones_asistencia confirmaciones_asistencia_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.confirmaciones_asistencia
    ADD CONSTRAINT confirmaciones_asistencia_pkey PRIMARY KEY (id);


--
-- Name: confirmaciones_asistencia confirmaciones_asistencia_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.confirmaciones_asistencia
    ADD CONSTRAINT confirmaciones_asistencia_token_hash_key UNIQUE (token_hash);


--
-- Name: encuesta_opciones encuesta_opciones_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_opciones
    ADD CONSTRAINT encuesta_opciones_pkey PRIMARY KEY (id);


--
-- Name: encuesta_preguntas encuesta_preguntas_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_preguntas
    ADD CONSTRAINT encuesta_preguntas_pkey PRIMARY KEY (id);


--
-- Name: encuesta_respuestas_detalles encuesta_respuestas_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_respuestas_detalles
    ADD CONSTRAINT encuesta_respuestas_detalles_pkey PRIMARY KEY (id);


--
-- Name: encuesta_respuestas encuesta_respuestas_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_respuestas
    ADD CONSTRAINT encuesta_respuestas_pkey PRIMARY KEY (id);


--
-- Name: encuestas encuestas_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuestas
    ADD CONSTRAINT encuestas_pkey PRIMARY KEY (id);


--
-- Name: estados_inscripcion estados_inscripcion_codigo_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.estados_inscripcion
    ADD CONSTRAINT estados_inscripcion_codigo_key UNIQUE (codigo);


--
-- Name: estados_inscripcion estados_inscripcion_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.estados_inscripcion
    ADD CONSTRAINT estados_inscripcion_pkey PRIMARY KEY (id);


--
-- Name: eventos eventos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_codigo_key UNIQUE (codigo);


--
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id);


--
-- Name: homologaciones_expositores homologaciones_expositores_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.homologaciones_expositores
    ADD CONSTRAINT homologaciones_expositores_pkey PRIMARY KEY (id);


--
-- Name: homologaciones_expositores homologaciones_expositores_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.homologaciones_expositores
    ADD CONSTRAINT homologaciones_expositores_usuario_id_key UNIQUE (usuario_id);


--
-- Name: logs_auditoria logs_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.logs_auditoria
    ADD CONSTRAINT logs_auditoria_pkey PRIMARY KEY (id);


--
-- Name: operadores operadores_email_institucional_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.operadores
    ADD CONSTRAINT operadores_email_institucional_key UNIQUE (email_institucional);


--
-- Name: operadores operadores_nombre_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.operadores
    ADD CONSTRAINT operadores_nombre_key UNIQUE (nombre);


--
-- Name: operadores operadores_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.operadores
    ADD CONSTRAINT operadores_pkey PRIMARY KEY (id);


--
-- Name: puntos_acceso puntos_acceso_nombre_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.puntos_acceso
    ADD CONSTRAINT puntos_acceso_nombre_key UNIQUE (nombre);


--
-- Name: puntos_acceso puntos_acceso_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.puntos_acceso
    ADD CONSTRAINT puntos_acceso_pkey PRIMARY KEY (id);


--
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: suscripciones_push suscripciones_push_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.suscripciones_push
    ADD CONSTRAINT suscripciones_push_endpoint_key UNIQUE (endpoint);


--
-- Name: suscripciones_push suscripciones_push_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.suscripciones_push
    ADD CONSTRAINT suscripciones_push_pkey PRIMARY KEY (id);


--
-- Name: tipos_acreditacion tipos_acreditacion_codigo_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.tipos_acreditacion
    ADD CONSTRAINT tipos_acreditacion_codigo_key UNIQUE (codigo);


--
-- Name: tipos_acreditacion tipos_acreditacion_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.tipos_acreditacion
    ADD CONSTRAINT tipos_acreditacion_pkey PRIMARY KEY (id);


--
-- Name: encuesta_respuestas uq_encuesta_usuario; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_respuestas
    ADD CONSTRAINT uq_encuesta_usuario UNIQUE (encuesta_id, usuario_id);


--
-- Name: usuarios uq_usuario_dni_evento; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT uq_usuario_dni_evento UNIQUE (dni_pasaporte, evento_id);


--
-- Name: certificados uq_usuario_tipo_certificado; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.certificados
    ADD CONSTRAINT uq_usuario_tipo_certificado UNIQUE (usuario_id, tipo_certificado);


--
-- Name: usuario_roles_adicionales usuario_roles_adicionales_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.usuario_roles_adicionales
    ADD CONSTRAINT usuario_roles_adicionales_pkey PRIMARY KEY (usuario_id, rol_id);


--
-- Name: usuarios usuarios_nombre_key; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_nombre_key UNIQUE (nombre);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_acreditaciones_actividad; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_acreditaciones_actividad ON public.acreditaciones USING btree (actividad_id);


--
-- Name: idx_acreditaciones_timestamp; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_acreditaciones_timestamp ON public.acreditaciones USING btree (timestamp_acreditacion);


--
-- Name: idx_acreditaciones_usuario; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_acreditaciones_usuario ON public.acreditaciones USING btree (usuario_id);


--
-- Name: idx_acreditaciones_usuario_fecha; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_acreditaciones_usuario_fecha ON public.acreditaciones USING btree (usuario_id, punto_acceso_id, timestamp_acreditacion DESC);


--
-- Name: idx_certificados_codigo; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_certificados_codigo ON public.certificados USING btree (codigo_verificacion);


--
-- Name: idx_certificados_evento; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_certificados_evento ON public.certificados USING btree (evento_id);


--
-- Name: idx_certificados_usuario; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_certificados_usuario ON public.certificados USING btree (usuario_id);


--
-- Name: idx_encuesta_opciones_pregunta; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_encuesta_opciones_pregunta ON public.encuesta_opciones USING btree (pregunta_id);


--
-- Name: idx_encuesta_preguntas_encuesta; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_encuesta_preguntas_encuesta ON public.encuesta_preguntas USING btree (encuesta_id);


--
-- Name: idx_encuesta_respuestas_detalles_cat; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_encuesta_respuestas_detalles_cat ON public.encuesta_respuestas_detalles USING btree (categoria_tematica_id);


--
-- Name: idx_encuesta_respuestas_detalles_preg; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_encuesta_respuestas_detalles_preg ON public.encuesta_respuestas_detalles USING btree (pregunta_id);


--
-- Name: idx_encuesta_respuestas_detalles_resp; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_encuesta_respuestas_detalles_resp ON public.encuesta_respuestas_detalles USING btree (respuesta_id);


--
-- Name: idx_encuesta_respuestas_encuesta; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_encuesta_respuestas_encuesta ON public.encuesta_respuestas USING btree (encuesta_id);


--
-- Name: idx_encuesta_respuestas_usuario; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_encuesta_respuestas_usuario ON public.encuesta_respuestas USING btree (usuario_id);


--
-- Name: idx_encuestas_etapa; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_encuestas_etapa ON public.encuestas USING btree (etapa, activa);


--
-- Name: idx_encuestas_evento; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_encuestas_evento ON public.encuestas USING btree (evento_id);


--
-- Name: idx_usuarios_dni_evento; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE UNIQUE INDEX idx_usuarios_dni_evento ON public.usuarios USING btree (dni_pasaporte, evento_id);


--
-- Name: idx_usuarios_estado; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_usuarios_estado ON public.usuarios USING btree (estado_inscripcion_id);


--
-- Name: idx_usuarios_evento; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_usuarios_evento ON public.usuarios USING btree (evento_id);


--
-- Name: idx_usuarios_rol; Type: INDEX; Schema: public; Owner: congreso_app
--

CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (rol_principal_id);


--
-- Name: usuarios trigger_intercept_blacklist; Type: TRIGGER; Schema: public; Owner: congreso_app
--

CREATE TRIGGER trigger_intercept_blacklist BEFORE INSERT ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.trg_check_blacklist();


--
-- Name: acreditaciones acreditaciones_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.acreditaciones
    ADD CONSTRAINT acreditaciones_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades(id) ON DELETE RESTRICT;


--
-- Name: acreditaciones acreditaciones_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.acreditaciones
    ADD CONSTRAINT acreditaciones_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.operadores(id) ON DELETE RESTRICT;


--
-- Name: acreditaciones acreditaciones_punto_acceso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.acreditaciones
    ADD CONSTRAINT acreditaciones_punto_acceso_id_fkey FOREIGN KEY (punto_acceso_id) REFERENCES public.puntos_acceso(id) ON DELETE RESTRICT;


--
-- Name: acreditaciones acreditaciones_tipo_acreditacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.acreditaciones
    ADD CONSTRAINT acreditaciones_tipo_acreditacion_id_fkey FOREIGN KEY (tipo_acreditacion_id) REFERENCES public.tipos_acreditacion(id) ON DELETE RESTRICT;


--
-- Name: acreditaciones acreditaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.acreditaciones
    ADD CONSTRAINT acreditaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: actividades actividades_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE CASCADE;


--
-- Name: actividades actividades_punto_acceso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_punto_acceso_id_fkey FOREIGN KEY (punto_acceso_id) REFERENCES public.puntos_acceso(id) ON DELETE RESTRICT;


--
-- Name: actividades actividades_tipo_acreditacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_tipo_acreditacion_id_fkey FOREIGN KEY (tipo_acreditacion_id) REFERENCES public.tipos_acreditacion(id) ON DELETE RESTRICT;


--
-- Name: certificados certificados_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.certificados
    ADD CONSTRAINT certificados_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE SET NULL;


--
-- Name: certificados certificados_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.certificados
    ADD CONSTRAINT certificados_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: confirmaciones_asistencia confirmaciones_asistencia_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.confirmaciones_asistencia
    ADD CONSTRAINT confirmaciones_asistencia_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: encuesta_opciones encuesta_opciones_categoria_tematica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_opciones
    ADD CONSTRAINT encuesta_opciones_categoria_tematica_id_fkey FOREIGN KEY (categoria_tematica_id) REFERENCES public.categorias_tematicas(id) ON DELETE SET NULL;


--
-- Name: encuesta_opciones encuesta_opciones_pregunta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_opciones
    ADD CONSTRAINT encuesta_opciones_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES public.encuesta_preguntas(id) ON DELETE CASCADE;


--
-- Name: encuesta_preguntas encuesta_preguntas_categoria_tematica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_preguntas
    ADD CONSTRAINT encuesta_preguntas_categoria_tematica_id_fkey FOREIGN KEY (categoria_tematica_id) REFERENCES public.categorias_tematicas(id) ON DELETE SET NULL;


--
-- Name: encuesta_preguntas encuesta_preguntas_encuesta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_preguntas
    ADD CONSTRAINT encuesta_preguntas_encuesta_id_fkey FOREIGN KEY (encuesta_id) REFERENCES public.encuestas(id) ON DELETE CASCADE;


--
-- Name: encuesta_respuestas_detalles encuesta_respuestas_detalles_categoria_tematica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_respuestas_detalles
    ADD CONSTRAINT encuesta_respuestas_detalles_categoria_tematica_id_fkey FOREIGN KEY (categoria_tematica_id) REFERENCES public.categorias_tematicas(id) ON DELETE SET NULL;


--
-- Name: encuesta_respuestas_detalles encuesta_respuestas_detalles_opcion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_respuestas_detalles
    ADD CONSTRAINT encuesta_respuestas_detalles_opcion_id_fkey FOREIGN KEY (opcion_id) REFERENCES public.encuesta_opciones(id) ON DELETE SET NULL;


--
-- Name: encuesta_respuestas_detalles encuesta_respuestas_detalles_pregunta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_respuestas_detalles
    ADD CONSTRAINT encuesta_respuestas_detalles_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES public.encuesta_preguntas(id) ON DELETE CASCADE;


--
-- Name: encuesta_respuestas_detalles encuesta_respuestas_detalles_respuesta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_respuestas_detalles
    ADD CONSTRAINT encuesta_respuestas_detalles_respuesta_id_fkey FOREIGN KEY (respuesta_id) REFERENCES public.encuesta_respuestas(id) ON DELETE CASCADE;


--
-- Name: encuesta_respuestas encuesta_respuestas_encuesta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_respuestas
    ADD CONSTRAINT encuesta_respuestas_encuesta_id_fkey FOREIGN KEY (encuesta_id) REFERENCES public.encuestas(id) ON DELETE CASCADE;


--
-- Name: encuesta_respuestas encuesta_respuestas_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_respuestas
    ADD CONSTRAINT encuesta_respuestas_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: encuesta_respuestas encuesta_respuestas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuesta_respuestas
    ADD CONSTRAINT encuesta_respuestas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: encuestas encuestas_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.encuestas
    ADD CONSTRAINT encuestas_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE CASCADE;


--
-- Name: homologaciones_expositores homologaciones_expositores_funcionario_anulador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.homologaciones_expositores
    ADD CONSTRAINT homologaciones_expositores_funcionario_anulador_id_fkey FOREIGN KEY (funcionario_anulador_id) REFERENCES public.operadores(id) ON DELETE SET NULL;


--
-- Name: homologaciones_expositores homologaciones_expositores_funcionario_validador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.homologaciones_expositores
    ADD CONSTRAINT homologaciones_expositores_funcionario_validador_id_fkey FOREIGN KEY (funcionario_validador_id) REFERENCES public.operadores(id) ON DELETE SET NULL;


--
-- Name: homologaciones_expositores homologaciones_expositores_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.homologaciones_expositores
    ADD CONSTRAINT homologaciones_expositores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: logs_auditoria logs_auditoria_usuario_afectado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.logs_auditoria
    ADD CONSTRAINT logs_auditoria_usuario_afectado_id_fkey FOREIGN KEY (usuario_afectado_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: operadores operadores_punto_acceso_default_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.operadores
    ADD CONSTRAINT operadores_punto_acceso_default_id_fkey FOREIGN KEY (punto_acceso_default_id) REFERENCES public.puntos_acceso(id) ON DELETE RESTRICT;


--
-- Name: operadores operadores_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.operadores
    ADD CONSTRAINT operadores_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


--
-- Name: suscripciones_push suscripciones_push_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.suscripciones_push
    ADD CONSTRAINT suscripciones_push_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: usuario_roles_adicionales usuario_roles_adicionales_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.usuario_roles_adicionales
    ADD CONSTRAINT usuario_roles_adicionales_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: usuario_roles_adicionales usuario_roles_adicionales_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.usuario_roles_adicionales
    ADD CONSTRAINT usuario_roles_adicionales_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_estado_inscripcion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_estado_inscripcion_id_fkey FOREIGN KEY (estado_inscripcion_id) REFERENCES public.estados_inscripcion(id) ON DELETE RESTRICT;


--
-- Name: usuarios usuarios_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE RESTRICT;


--
-- Name: usuarios usuarios_rol_principal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: congreso_app
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rol_principal_id_fkey FOREIGN KEY (rol_principal_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 4eohhBxj9y5IJAFkTKO2Zf4FjPXypwtNNR6cPacpQ1gAfeFbvJjDdEerhp60ekO

