--
-- PostgreSQL database dump
--

\restrict 9bN9jNcjWOIHr8T1maec7yt93OIILI8s3yuRK475LN58QviFRL0RtxFnENViJ1i

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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: acreditaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.acreditaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    operador_id integer,
    punto_acceso_id integer,
    es_manual boolean DEFAULT false NOT NULL,
    fecha_hora timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.acreditaciones OWNER TO postgres;

--
-- Name: actividades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actividades (
    id integer NOT NULL,
    evento_id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    tipo character varying(100),
    tipo_acreditacion_id integer,
    punto_acceso_id integer,
    cupo_maximo integer,
    horario_inicio timestamp with time zone NOT NULL,
    horario_fin timestamp with time zone,
    disertante_nombre character varying(255),
    activa boolean DEFAULT true NOT NULL,
    publicada boolean DEFAULT false NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_actividad_cupo CHECK (((cupo_maximo IS NULL) OR (cupo_maximo > 0))),
    CONSTRAINT chk_actividad_horario CHECK (((horario_fin IS NULL) OR (horario_fin > horario_inicio)))
);


ALTER TABLE public.actividades OWNER TO postgres;

--
-- Name: actividades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actividades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actividades_id_seq OWNER TO postgres;

--
-- Name: actividades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actividades_id_seq OWNED BY public.actividades.id;


--
-- Name: asistencias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asistencias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    actividad_id integer NOT NULL,
    operador_id integer,
    fecha_hora timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.asistencias OWNER TO postgres;

--
-- Name: configuraciones_sistema; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuraciones_sistema (
    clave character varying(100) NOT NULL,
    valor jsonb NOT NULL,
    descripcion text,
    categoria character varying(50) DEFAULT 'GENERAL'::character varying NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.configuraciones_sistema OWNER TO postgres;

--
-- Name: estados_inscripcion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estados_inscripcion (
    id integer NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(50) NOT NULL,
    permite_ingreso boolean DEFAULT false NOT NULL,
    descripcion text
);


ALTER TABLE public.estados_inscripcion OWNER TO postgres;

--
-- Name: estados_inscripcion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.estados_inscripcion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estados_inscripcion_id_seq OWNER TO postgres;

--
-- Name: estados_inscripcion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.estados_inscripcion_id_seq OWNED BY public.estados_inscripcion.id;


--
-- Name: eventos; Type: TABLE; Schema: public; Owner: postgres
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
    horario_apertura character varying(10),
    horario_cierre character varying(10),
    lugar_nombre character varying(200),
    direccion character varying(250),
    ciudad character varying(100),
    cupo_maximo integer,
    estado character varying(30) DEFAULT 'PUBLICADO'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_evento_cupo CHECK (((cupo_maximo IS NULL) OR (cupo_maximo > 0))),
    CONSTRAINT chk_evento_fechas CHECK ((fecha_fin >= fecha_inicio))
);


ALTER TABLE public.eventos OWNER TO postgres;

--
-- Name: eventos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eventos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eventos_id_seq OWNER TO postgres;

--
-- Name: eventos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eventos_id_seq OWNED BY public.eventos.id;


--
-- Name: logs_auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs_auditoria (
    id bigint NOT NULL,
    operador_id integer,
    accion character varying(100) NOT NULL,
    usuario_id uuid,
    detalles jsonb,
    ip_origen character varying(45),
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.logs_auditoria OWNER TO postgres;

--
-- Name: logs_auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logs_auditoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_auditoria_id_seq OWNER TO postgres;

--
-- Name: logs_auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logs_auditoria_id_seq OWNED BY public.logs_auditoria.id;


--
-- Name: materiales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materiales (
    id integer NOT NULL,
    evento_id integer NOT NULL,
    titulo character varying(200) NOT NULL,
    descripcion text,
    categoria character varying(100),
    archivo_url character varying(500),
    publicada boolean DEFAULT false NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.materiales OWNER TO postgres;

--
-- Name: materiales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.materiales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.materiales_id_seq OWNER TO postgres;

--
-- Name: materiales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.materiales_id_seq OWNED BY public.materiales.id;


--
-- Name: novedades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.novedades (
    id integer NOT NULL,
    evento_id integer NOT NULL,
    titulo character varying(200) NOT NULL,
    slug character varying(220) NOT NULL,
    resumen character varying(500),
    contenido text NOT NULL,
    imagen_url character varying(500),
    publicada boolean DEFAULT false NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.novedades OWNER TO postgres;

--
-- Name: novedades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.novedades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.novedades_id_seq OWNER TO postgres;

--
-- Name: novedades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.novedades_id_seq OWNED BY public.novedades.id;


--
-- Name: operadores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operadores (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email_institucional character varying(150) NOT NULL,
    rol_id integer NOT NULL,
    punto_acceso_default_id integer,
    password_hash character varying(255),
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.operadores OWNER TO postgres;

--
-- Name: operadores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operadores_id_seq OWNER TO postgres;

--
-- Name: operadores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operadores_id_seq OWNED BY public.operadores.id;


--
-- Name: preguntas_frecuentes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preguntas_frecuentes (
    id integer NOT NULL,
    evento_id integer NOT NULL,
    pregunta character varying(500) NOT NULL,
    respuesta text NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.preguntas_frecuentes OWNER TO postgres;

--
-- Name: preguntas_frecuentes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.preguntas_frecuentes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preguntas_frecuentes_id_seq OWNER TO postgres;

--
-- Name: preguntas_frecuentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.preguntas_frecuentes_id_seq OWNED BY public.preguntas_frecuentes.id;


--
-- Name: puntos_acceso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.puntos_acceso (
    id integer NOT NULL,
    evento_id integer,
    nombre character varying(150) NOT NULL,
    ubicacion_fisica character varying(200),
    tipo_punto character varying(50) DEFAULT 'OPERACION'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.puntos_acceso OWNER TO postgres;

--
-- Name: puntos_acceso_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.puntos_acceso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.puntos_acceso_id_seq OWNER TO postgres;

--
-- Name: puntos_acceso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.puntos_acceso_id_seq OWNED BY public.puntos_acceso.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text,
    jerarquia integer DEFAULT 1 NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: tipos_acreditacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipos_acreditacion (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    descripcion character varying(150) NOT NULL,
    requiere_actividad boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tipos_acreditacion OWNER TO postgres;

--
-- Name: tipos_acreditacion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipos_acreditacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_acreditacion_id_seq OWNER TO postgres;

--
-- Name: tipos_acreditacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipos_acreditacion_id_seq OWNED BY public.tipos_acreditacion.id;


--
-- Name: usuario_roles_adicionales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario_roles_adicionales (
    usuario_id uuid NOT NULL,
    rol_id integer NOT NULL,
    asignado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.usuario_roles_adicionales OWNER TO postgres;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evento_id integer NOT NULL,
    tipo_documento character varying(30) NOT NULL,
    dni_pasaporte character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    celular character varying(30),
    institucion character varying(200),
    rol_principal_id integer NOT NULL,
    condiciones_adicionales text,
    intereses text,
    acepta_comunicaciones boolean DEFAULT false NOT NULL,
    estado_inscripcion_id integer NOT NULL,
    qr_token uuid,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: actividades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades ALTER COLUMN id SET DEFAULT nextval('public.actividades_id_seq'::regclass);


--
-- Name: estados_inscripcion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estados_inscripcion ALTER COLUMN id SET DEFAULT nextval('public.estados_inscripcion_id_seq'::regclass);


--
-- Name: eventos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos ALTER COLUMN id SET DEFAULT nextval('public.eventos_id_seq'::regclass);


--
-- Name: logs_auditoria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs_auditoria ALTER COLUMN id SET DEFAULT nextval('public.logs_auditoria_id_seq'::regclass);


--
-- Name: materiales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materiales ALTER COLUMN id SET DEFAULT nextval('public.materiales_id_seq'::regclass);


--
-- Name: novedades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.novedades ALTER COLUMN id SET DEFAULT nextval('public.novedades_id_seq'::regclass);


--
-- Name: operadores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operadores ALTER COLUMN id SET DEFAULT nextval('public.operadores_id_seq'::regclass);


--
-- Name: preguntas_frecuentes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preguntas_frecuentes ALTER COLUMN id SET DEFAULT nextval('public.preguntas_frecuentes_id_seq'::regclass);


--
-- Name: puntos_acceso id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.puntos_acceso ALTER COLUMN id SET DEFAULT nextval('public.puntos_acceso_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: tipos_acreditacion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_acreditacion ALTER COLUMN id SET DEFAULT nextval('public.tipos_acreditacion_id_seq'::regclass);


--
-- Data for Name: acreditaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acreditaciones (id, usuario_id, operador_id, punto_acceso_id, es_manual, fecha_hora) FROM stdin;
\.


--
-- Data for Name: actividades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actividades (id, evento_id, nombre, descripcion, tipo, tipo_acreditacion_id, punto_acceso_id, cupo_maximo, horario_inicio, horario_fin, disertante_nombre, activa, publicada, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: asistencias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asistencias (id, usuario_id, actividad_id, operador_id, fecha_hora) FROM stdin;
\.


--
-- Data for Name: configuraciones_sistema; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configuraciones_sistema (clave, valor, descripcion, categoria, actualizado_en) FROM stdin;
aforo_maximo_confirmados	{"cupo": 10}	Cupo máximo de inscripciones confirmadas para desarrollo y pruebas.	INSCRIPCION	2026-09-29 07:04:43.785689-03
inscripciones_habilitadas	{"habilitada": true}	Permite habilitar o deshabilitar el registro público.	INSCRIPCION	2026-09-29 07:04:43.785689-03
\.


--
-- Data for Name: estados_inscripcion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.estados_inscripcion (id, codigo, nombre, permite_ingreso, descripcion) FROM stdin;
1	CONFIRMADO	Confirmado	t	Inscripción confirmada con cupo disponible.
2	LISTA_ESPERA	Lista de Espera	f	Registro realizado luego de alcanzar el cupo de confirmados.
3	CANCELADO	Cancelado	f	Inscripción cancelada.
\.


--
-- Data for Name: eventos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventos (id, codigo, nombre, lema, descripcion, anio, fecha_inicio, fecha_fin, horario_apertura, horario_cierre, lugar_nombre, direccion, ciudad, cupo_maximo, estado, activo, creado_en, actualizado_en) FROM stdin;
1	ETS_2026	1er Congreso de Educación Técnica Superior – ETS 2026	Construyendo Futuros desde la Educación Técnica Superior	Instancia institucional, académico-aplicada, demostrativa y formativa de la Educación Técnica Superior.	2026	2026-11-06	2026-11-06	10:30	20:30	Universidad de la Ciudad de Buenos Aires	Tte. Gral. Juan Domingo Perón 802	Ciudad Autónoma de Buenos Aires	10	PUBLICADO	t	2026-09-29 07:04:43.785689-03	2026-09-29 07:04:43.785689-03
\.


--
-- Data for Name: logs_auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logs_auditoria (id, operador_id, accion, usuario_id, detalles, ip_origen, creado_en) FROM stdin;
1	4	LOGIN_FALLIDO	\N	{"email": "superadmin.congreso@bue.edu.ar"}	::1	2026-09-29 07:05:41.199066-03
2	3	LOGIN_FALLIDO	\N	{"email": "admin@ifts04.edu.ar"}	::1	2026-09-29 07:06:00.197761-03
3	3	LOGIN_FALLIDO	\N	{"email": "admin@ifts04.edu.ar"}	::1	2026-09-29 07:06:03.099741-03
4	4	LOGIN_FALLIDO	\N	{"email": "superadmin.congreso@bue.edu.ar"}	::1	2026-09-29 07:09:56.566031-03
5	3	LOGIN_FALLIDO	\N	{"email": "admin@ifts04.edu.ar"}	::1	2026-09-29 07:10:10.469029-03
6	4	LOGIN_EXITOSO	\N	{"rol": "Superadmin", "operador_id": 4}	::1	2026-09-29 07:14:10.123569-03
7	\N	REGISTRO_CONFIRMADO	16956cee-9c69-45af-9119-06d083d3d8cb	{"estado": "CONFIRMADO", "evento_id": 1, "acepta_comunicaciones": true}	::1	2026-09-29 07:19:54.089469-03
8	\N	REGISTRO_CONFIRMADO	b38c1c9f-7a55-42cf-854a-6d5c43ad721b	{"estado": "CONFIRMADO", "evento_id": 1, "acepta_comunicaciones": true}	::1	2026-09-29 07:20:47.020905-03
9	\N	REGISTRO_CONFIRMADO	34259353-6a89-43a8-a9b1-66fecde3bc1a	{"estado": "CONFIRMADO", "evento_id": 1, "acepta_comunicaciones": false}	::1	2026-09-29 07:23:02.258929-03
10	\N	REGISTRO_DUPLICADO_RECHAZADO	34259353-6a89-43a8-a9b1-66fecde3bc1a	{"evento_id": 1, "estado_actual": "CONFIRMADO"}	::1	2026-09-29 07:24:31.499782-03
11	\N	REGISTRO_CONFIRMADO	ed911806-165a-448e-82ab-116f918e2cfb	{"estado": "CONFIRMADO", "evento_id": 1, "acepta_comunicaciones": false}	::1	2026-09-29 08:37:41.315403-03
12	\N	REGISTRO_DUPLICADO_RECHAZADO	ed911806-165a-448e-82ab-116f918e2cfb	{"evento_id": 1, "estado_actual": "CONFIRMADO"}	::1	2026-09-29 08:39:12.515256-03
\.


--
-- Data for Name: materiales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.materiales (id, evento_id, titulo, descripcion, categoria, archivo_url, publicada, activa, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: novedades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.novedades (id, evento_id, titulo, slug, resumen, contenido, imagen_url, publicada, activa, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: operadores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operadores (id, nombre, apellido, email_institucional, rol_id, punto_acceso_default_id, password_hash, activo, creado_en) FROM stdin;
2	Operador 2	Acreditación	operador2.lateral@bue.edu.ar	5	2	8efca2b70554ac9b9195a0da4daab3ac:315cccef0c4a62df6d701b5a02ba5abf4bee74c4b850ce8c8ee7cceff9e424e5e4c49a040f325553eb6c16dfadb5b548e17528328fc0c84b0d3bb4dc814dff5b	t	2026-09-29 07:04:43.785689-03
4	Superadmin	General	superadmin.congreso@bue.edu.ar	8	1	a97ab448fde6cf1e2b33ec88c4e8e695:362650f7324319bf182333bc9f2d567bf474051fb4f7424702d7ccdc322728a9496e31ce56b213f130be1a1d187f9806f677c1ecb378f5b4043909ec4016f096	t	2026-09-29 07:04:43.785689-03
3	Administrador	General	admin@ifts4.edu.ar	7	1	ef46f519770110f10857c45ab1d7de7f:52bc103bbe6e3eabd57a0d027324549f27c784cca121df358232b795218da8be8efd53180e779d4624da324d3cd567052f233b74b2134e52cf67c3eabb276f3e	t	2026-09-29 07:04:43.785689-03
7	Verificador	DETS	verificador.dets@bue.edu.ar	6	1	0c5528e05453c84c2a49da54d3d58b19:40502f53a8f7f587f749ca4c9e442048274384d2cdc7a9f90d74afdb9acf43b7e7c2d4da3e91fa5a02073687071d39ac62225351ea658dbafa44ba5288b93fc0	t	2026-09-29 07:13:25.840131-03
1	Operador 1	Puerta Principal	operador1.puerta@bue.edu.ar	5	1	c909c8d2b3154baad76471ef7e0a547c:1a23c297f936c2db0caf62c47df7ce12598209fba83d1806b79104f6eb033f302d282acb18987ea915c4049b44c2a5839cb63ce587b4c36cfbfc2360cdc4f333	t	2026-09-29 07:04:43.785689-03
\.


--
-- Data for Name: preguntas_frecuentes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preguntas_frecuentes (id, evento_id, pregunta, respuesta, orden, activa, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: puntos_acceso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.puntos_acceso (id, evento_id, nombre, ubicacion_fisica, tipo_punto, activo, creado_en) FROM stdin;
1	1	Acceso General	Ingreso principal	OPERACION	t	2026-09-29 07:04:43.785689-03
2	1	Puesto de Acreditación	Sector de acreditación	OPERACION	t	2026-09-29 07:04:43.785689-03
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, nombre, descripcion, jerarquia, creado_en) FROM stdin;
1	Estudiante	Estudiante de Nivel Técnico Superior o afín	1	2026-09-29 07:04:43.785689-03
2	Docente	Personal académico / Docente	1	2026-09-29 07:04:43.785689-03
3	Expositor	Disertante o Tallerista	2	2026-09-29 07:04:43.785689-03
4	Autoridad	Autoridad Institucional / Ministerial / Invitado Especial	2	2026-09-29 07:04:43.785689-03
5	Operador	Personal autorizado para operar el sistema	3	2026-09-29 07:04:43.785689-03
6	Verificador	Funcionario habilitado para tareas de verificación	4	2026-09-29 07:04:43.785689-03
7	Administrador	Personal autorizado para administrar el sistema	4	2026-09-29 07:04:43.785689-03
8	Superadmin	Administrador con permisos máximos	5	2026-09-29 07:04:43.785689-03
\.


--
-- Data for Name: tipos_acreditacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipos_acreditacion (id, codigo, descripcion, requiere_actividad) FROM stdin;
1	ACCESO_GENERAL	Acreditación general al Congreso	f
2	ACTIVIDAD_AULA	Asistencia a actividad o presentación	t
3	TALLER	Participación en taller	t
4	MASTERCLASS	Participación en masterclass	t
\.


--
-- Data for Name: usuario_roles_adicionales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario_roles_adicionales (usuario_id, rol_id, asignado_en) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, evento_id, tipo_documento, dni_pasaporte, nombre, apellido, email, celular, institucion, rol_principal_id, condiciones_adicionales, intereses, acepta_comunicaciones, estado_inscripcion_id, qr_token, creado_en, actualizado_en) FROM stdin;
16956cee-9c69-45af-9119-06d083d3d8cb	1	DNI	12345678	Juan	Perez	juan@perez.com	+541112345678	\N	1	\N	\N	t	1	d0dc6df6-16b8-44b2-8e87-7cff7f7b6d5c	2026-09-29 07:19:54.089469-03	2026-09-29 07:19:54.089469-03
b38c1c9f-7a55-42cf-854a-6d5c43ad721b	1	DNI	87654321	Maria	Gomez	maria@gomez.com	+541112345678	\N	1	\N	\N	t	1	56db60b4-844f-411c-aec6-b71f2083ca8d	2026-09-29 07:20:47.020905-03	2026-09-29 07:20:47.020905-03
34259353-6a89-43a8-a9b1-66fecde3bc1a	1	DNI	18185452	Luis	Ojeda	luisojeda2014@gmail.com	1132009377	\N	1	\N	\N	f	1	dfa9ea2b-5408-4682-aaf4-94fda4957e37	2026-09-29 07:23:02.258929-03	2026-09-29 07:23:02.258929-03
ed911806-165a-448e-82ab-116f918e2cfb	1	DNI	40088994	Melina	Ojeda	melinaojeda@mail.com	3814418909	\N	1	\N	\N	f	1	c70d29e6-ae47-4cab-b37a-0a086f8d46ba	2026-09-29 08:37:41.315403-03	2026-09-29 08:37:41.315403-03
\.


--
-- Name: actividades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actividades_id_seq', 1, false);


--
-- Name: estados_inscripcion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estados_inscripcion_id_seq', 3, true);


--
-- Name: eventos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eventos_id_seq', 1, true);


--
-- Name: logs_auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logs_auditoria_id_seq', 12, true);


--
-- Name: materiales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.materiales_id_seq', 1, false);


--
-- Name: novedades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.novedades_id_seq', 1, false);


--
-- Name: operadores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operadores_id_seq', 8, true);


--
-- Name: preguntas_frecuentes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.preguntas_frecuentes_id_seq', 1, false);


--
-- Name: puntos_acceso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.puntos_acceso_id_seq', 2, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 8, true);


--
-- Name: tipos_acreditacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipos_acreditacion_id_seq', 4, true);


--
-- Name: acreditaciones acreditaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acreditaciones
    ADD CONSTRAINT acreditaciones_pkey PRIMARY KEY (id);


--
-- Name: actividades actividades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_pkey PRIMARY KEY (id);


--
-- Name: asistencias asistencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_pkey PRIMARY KEY (id);


--
-- Name: configuraciones_sistema configuraciones_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuraciones_sistema
    ADD CONSTRAINT configuraciones_sistema_pkey PRIMARY KEY (clave);


--
-- Name: estados_inscripcion estados_inscripcion_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estados_inscripcion
    ADD CONSTRAINT estados_inscripcion_codigo_key UNIQUE (codigo);


--
-- Name: estados_inscripcion estados_inscripcion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estados_inscripcion
    ADD CONSTRAINT estados_inscripcion_pkey PRIMARY KEY (id);


--
-- Name: eventos eventos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_codigo_key UNIQUE (codigo);


--
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id);


--
-- Name: logs_auditoria logs_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs_auditoria
    ADD CONSTRAINT logs_auditoria_pkey PRIMARY KEY (id);


--
-- Name: materiales materiales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materiales
    ADD CONSTRAINT materiales_pkey PRIMARY KEY (id);


--
-- Name: novedades novedades_evento_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.novedades
    ADD CONSTRAINT novedades_evento_id_slug_key UNIQUE (evento_id, slug);


--
-- Name: novedades novedades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.novedades
    ADD CONSTRAINT novedades_pkey PRIMARY KEY (id);


--
-- Name: operadores operadores_email_institucional_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operadores
    ADD CONSTRAINT operadores_email_institucional_key UNIQUE (email_institucional);


--
-- Name: operadores operadores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operadores
    ADD CONSTRAINT operadores_pkey PRIMARY KEY (id);


--
-- Name: preguntas_frecuentes preguntas_frecuentes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preguntas_frecuentes
    ADD CONSTRAINT preguntas_frecuentes_pkey PRIMARY KEY (id);


--
-- Name: puntos_acceso puntos_acceso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.puntos_acceso
    ADD CONSTRAINT puntos_acceso_pkey PRIMARY KEY (id);


--
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: tipos_acreditacion tipos_acreditacion_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_acreditacion
    ADD CONSTRAINT tipos_acreditacion_codigo_key UNIQUE (codigo);


--
-- Name: tipos_acreditacion tipos_acreditacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_acreditacion
    ADD CONSTRAINT tipos_acreditacion_pkey PRIMARY KEY (id);


--
-- Name: acreditaciones uq_acreditacion_usuario; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acreditaciones
    ADD CONSTRAINT uq_acreditacion_usuario UNIQUE (usuario_id);


--
-- Name: asistencias uq_asistencia_usuario_actividad; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT uq_asistencia_usuario_actividad UNIQUE (usuario_id, actividad_id);


--
-- Name: puntos_acceso uq_punto_evento; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.puntos_acceso
    ADD CONSTRAINT uq_punto_evento UNIQUE (evento_id, nombre);


--
-- Name: usuarios uq_usuario_documento_evento; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT uq_usuario_documento_evento UNIQUE (tipo_documento, dni_pasaporte, evento_id);


--
-- Name: usuario_roles_adicionales usuario_roles_adicionales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_roles_adicionales
    ADD CONSTRAINT usuario_roles_adicionales_pkey PRIMARY KEY (usuario_id, rol_id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_qr_token_key UNIQUE (qr_token);


--
-- Name: idx_acreditaciones_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acreditaciones_fecha ON public.acreditaciones USING btree (fecha_hora);


--
-- Name: idx_actividades_evento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_evento ON public.actividades USING btree (evento_id);


--
-- Name: idx_actividades_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_fecha ON public.actividades USING btree (horario_inicio);


--
-- Name: idx_actividades_publicadas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actividades_publicadas ON public.actividades USING btree (publicada);


--
-- Name: idx_asistencias_actividad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asistencias_actividad ON public.asistencias USING btree (actividad_id);


--
-- Name: idx_asistencias_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asistencias_fecha ON public.asistencias USING btree (fecha_hora);


--
-- Name: idx_faq_activa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_faq_activa ON public.preguntas_frecuentes USING btree (evento_id, activa, orden);


--
-- Name: idx_faq_evento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_faq_evento ON public.preguntas_frecuentes USING btree (evento_id);


--
-- Name: idx_logs_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_fecha ON public.logs_auditoria USING btree (creado_en);


--
-- Name: idx_logs_operador; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_operador ON public.logs_auditoria USING btree (operador_id);


--
-- Name: idx_materiales_evento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materiales_evento ON public.materiales USING btree (evento_id);


--
-- Name: idx_materiales_publicada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materiales_publicada ON public.materiales USING btree (evento_id, publicada, activa);


--
-- Name: idx_novedades_evento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_novedades_evento ON public.novedades USING btree (evento_id);


--
-- Name: idx_novedades_publicada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_novedades_publicada ON public.novedades USING btree (evento_id, publicada, activa);


--
-- Name: idx_usuarios_apellido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_apellido ON public.usuarios USING btree (apellido);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: idx_usuarios_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_estado ON public.usuarios USING btree (estado_inscripcion_id);


--
-- Name: idx_usuarios_evento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_evento ON public.usuarios USING btree (evento_id);


--
-- Name: idx_usuarios_institucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_institucion ON public.usuarios USING btree (institucion);


--
-- Name: acreditaciones acreditaciones_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acreditaciones
    ADD CONSTRAINT acreditaciones_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.operadores(id) ON DELETE SET NULL;


--
-- Name: acreditaciones acreditaciones_punto_acceso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acreditaciones
    ADD CONSTRAINT acreditaciones_punto_acceso_id_fkey FOREIGN KEY (punto_acceso_id) REFERENCES public.puntos_acceso(id) ON DELETE SET NULL;


--
-- Name: acreditaciones acreditaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acreditaciones
    ADD CONSTRAINT acreditaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: actividades actividades_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE CASCADE;


--
-- Name: actividades actividades_punto_acceso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_punto_acceso_id_fkey FOREIGN KEY (punto_acceso_id) REFERENCES public.puntos_acceso(id) ON DELETE SET NULL;


--
-- Name: actividades actividades_tipo_acreditacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_tipo_acreditacion_id_fkey FOREIGN KEY (tipo_acreditacion_id) REFERENCES public.tipos_acreditacion(id) ON DELETE RESTRICT;


--
-- Name: asistencias asistencias_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividades(id) ON DELETE CASCADE;


--
-- Name: asistencias asistencias_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.operadores(id) ON DELETE SET NULL;


--
-- Name: asistencias asistencias_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: logs_auditoria logs_auditoria_operador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs_auditoria
    ADD CONSTRAINT logs_auditoria_operador_id_fkey FOREIGN KEY (operador_id) REFERENCES public.operadores(id) ON DELETE SET NULL;


--
-- Name: logs_auditoria logs_auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs_auditoria
    ADD CONSTRAINT logs_auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: materiales materiales_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materiales
    ADD CONSTRAINT materiales_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE CASCADE;


--
-- Name: novedades novedades_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.novedades
    ADD CONSTRAINT novedades_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE CASCADE;


--
-- Name: operadores operadores_punto_acceso_default_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operadores
    ADD CONSTRAINT operadores_punto_acceso_default_id_fkey FOREIGN KEY (punto_acceso_default_id) REFERENCES public.puntos_acceso(id) ON DELETE SET NULL;


--
-- Name: operadores operadores_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operadores
    ADD CONSTRAINT operadores_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: preguntas_frecuentes preguntas_frecuentes_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preguntas_frecuentes
    ADD CONSTRAINT preguntas_frecuentes_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE CASCADE;


--
-- Name: puntos_acceso puntos_acceso_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.puntos_acceso
    ADD CONSTRAINT puntos_acceso_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE CASCADE;


--
-- Name: usuario_roles_adicionales usuario_roles_adicionales_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_roles_adicionales
    ADD CONSTRAINT usuario_roles_adicionales_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: usuario_roles_adicionales usuario_roles_adicionales_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_roles_adicionales
    ADD CONSTRAINT usuario_roles_adicionales_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_estado_inscripcion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_estado_inscripcion_id_fkey FOREIGN KEY (estado_inscripcion_id) REFERENCES public.estados_inscripcion(id) ON DELETE RESTRICT;


--
-- Name: usuarios usuarios_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE RESTRICT;


--
-- Name: usuarios usuarios_rol_principal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rol_principal_id_fkey FOREIGN KEY (rol_principal_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 9bN9jNcjWOIHr8T1maec7yt93OIILI8s3yuRK475LN58QviFRL0RtxFnENViJ1i

