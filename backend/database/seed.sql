-- ============================================================================
-- CONGRESO ETS 2026 - SEED DE DATOS INICIALES (PostgreSQL)
-- ============================================================================

-- 1. Roles del Sistema
INSERT INTO roles (id, nombre, descripcion, jerarquia) VALUES
    (1, 'Asistente General', 'Asistencia abierta a conferencias y áreas comunes', 1),
    (2, 'Estudiante IFTS', 'Estudiante regular de Institutos de Formación Técnica Superior', 1),
    (3, 'Docente / Directivo IFTS', 'Personal académico o directivo de institutos técnicos', 2),
    (4, 'Disertante / Expositor', 'Orador invitado o panelista temático', 2),
    (5, 'Operador de Puerta', 'Control de acreditaciones con escáner QR en puntos de acceso', 3),
    (6, 'Verificador de Mesa', 'Mesa de entradas, resolución de contingencias y reasignaciones', 3),
    (7, 'Administrador DETS', 'Gestión integral académica, aforos, certificados y encuestas', 4),
    (8, 'Superadmin', 'Administrador total con facultades de sobrecupo y override', 5)
ON CONFLICT (id) DO UPDATE 
SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, jerarquia = EXCLUDED.jerarquia;

SELECT setval('roles_id_seq', (SELECT GREATEST(MAX(id), 8) FROM roles));

-- 2. Estados de Inscripción
INSERT INTO estados_inscripcion (id, codigo, nombre, permite_ingreso, descripcion) VALUES
    (1, 'CONFIRMADO', 'Confirmado', TRUE, 'Inscripción activa con cupo asegurado y credencial habilitada'),
    (2, 'LISTA_ESPERA', 'Lista de Espera', FALSE, 'Sin cupo inmediato por capacidad de aforo completada (FIFO)'),
    (3, 'SANCIONADO', 'Sancionado', FALSE, 'Restricción disciplinaria activa por inclusión en Lista Negra / Blacklist'),
    (4, 'BAJA_AUTOMATICA', 'Baja Automática 48hs', FALSE, 'No confirmó asistencia en la ventana de 24hs tras el aviso de 48hs'),
    (5, 'CANCELADO', 'Cancelado', FALSE, 'Baja voluntaria o revocada manualmente')
ON CONFLICT (id) DO UPDATE 
SET codigo = EXCLUDED.codigo, nombre = EXCLUDED.nombre, permite_ingreso = EXCLUDED.permite_ingreso, descripcion = EXCLUDED.descripcion;

SELECT setval('estados_inscripcion_id_seq', (SELECT GREATEST(MAX(id), 5) FROM estados_inscripcion));

-- 3. Eventos Base
INSERT INTO eventos (id, codigo, nombre, descripcion, anio, fecha_inicio, fecha_fin, activo) VALUES
    (1, 'ETS_2026', '1er Congreso de Educación Técnica Superior 2026', 'Edición inaugural en Auditorio Polo Saavedra', 2026, '2026-11-06', '2026-11-06', TRUE),
    (2, 'ETS_2027', '2do Congreso de Educación Técnica Superior 2027', 'Edición de consolidación y nuevas especialidades', 2027, '2027-11-05', '2027-11-05', TRUE)
ON CONFLICT (id) DO UPDATE
SET codigo = EXCLUDED.codigo, nombre = EXCLUDED.nombre, anio = EXCLUDED.anio, fecha_inicio = EXCLUDED.fecha_inicio, fecha_fin = EXCLUDED.fecha_fin;

SELECT setval('eventos_id_seq', (SELECT GREATEST(MAX(id), 2) FROM eventos));

-- 4. Puntos de Acceso Físicos / Recintos (Auditorio Polo Saavedra)
INSERT INTO puntos_acceso (id, evento_id, nombre, ubicacion_fisica, tipo_punto, capacidad_maxima, activo) VALUES
    (1, 1, 'Acceso General - Puerta Principal', 'Hall de Entrada Principal - PB', 'PUESTO_ACCESO', 500, TRUE),
    (2, 1, 'Acceso General - Puerta Lateral', 'Acceso Rampa Accesible - PB', 'PUESTO_ACCESO', 500, TRUE),
    (3, 1, 'Aula Magna - Auditorio Central', 'Auditorio Principal', 'AULA_SALON', 400, TRUE),
    (4, 1, 'Aula 1 - Robótica y Automatización', 'Primer Piso - Sector Este', 'AULA_SALON', 100, TRUE),
    (5, 1, 'Aula 2 - Inteligencia Artificial y Big Data', 'Primer Piso - Sector Oeste', 'AULA_SALON', 60, TRUE),
    (6, 1, 'Taller 1 - Redes y Ciberseguridad', 'Subsuelo - Laboratorio A', 'TALLER_LAB', 35, TRUE),
    (7, 1, 'Taller 2 - Desarrollo Web y Cloud', 'Subsuelo - Laboratorio B', 'TALLER_LAB', 50, TRUE)
ON CONFLICT (id) DO UPDATE 
SET nombre = EXCLUDED.nombre, ubicacion_fisica = EXCLUDED.ubicacion_fisica, tipo_punto = EXCLUDED.tipo_punto, capacidad_maxima = EXCLUDED.capacidad_maxima, activo = EXCLUDED.activo;

SELECT setval('puntos_acceso_id_seq', (SELECT GREATEST(MAX(id), 7) FROM puntos_acceso));

-- 5. Tipos de Acreditación
INSERT INTO tipos_acreditacion (id, codigo, descripcion, requiere_actividad) VALUES
    (1, 'ACCESO_GENERAL', 'Ingreso al predio del Auditorio Polo Saavedra', FALSE),
    (2, 'ACTIVIDAD_AULA', 'Ingreso a conferencia o panel en aula temática', TRUE),
    (3, 'TALLER', 'Participación en taller práctico con cupo limitado', TRUE),
    (4, 'MASTERCLASS', 'Clase magistral con expositor principal', TRUE)
ON CONFLICT (id) DO UPDATE 
SET codigo = EXCLUDED.codigo, descripcion = EXCLUDED.descripcion, requiere_actividad = EXCLUDED.requiere_actividad;

SELECT setval('tipos_acreditacion_id_seq', (SELECT GREATEST(MAX(id), 4) FROM tipos_acreditacion));

-- 6. Categorías Temáticas Normalizadas
INSERT INTO categorias_tematicas (id, nombre, descripcion) VALUES
    (1, 'Inteligencia Artificial y Machine Learning', 'Modelos generativos, agentes y automatización inteligente'),
    (2, 'Ciberseguridad y Protección de Datos', 'Defensa de infraestructuras, normativas y forensia digital'),
    (3, 'Desarrollo Cloud y Arquitecturas Web', 'Sistemas distribuidos, microservicios, DevOps y APIs'),
    (4, 'Robótica, Automatización e IoT', 'Sistemas embebidos, sensores y robótica aplicada'),
    (5, 'Inserción Laboral y Prácticas IFTS', 'Pasantías, articulación con cámaras empresariales y mentorías'),
    (6, 'Ciencia de Datos y Analítica', 'Big data, visualización estratégica y pipelines de datos')
ON CONFLICT (id) DO UPDATE
SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion;

SELECT setval('categorias_tematicas_id_seq', (SELECT GREATEST(MAX(id), 6) FROM categorias_tematicas));

-- 7. Catálogo Maestro de Actividades Canónicas
INSERT INTO catalogo_actividades (id, codigo, nombre, descripcion, tipo_acreditacion_id, categoria_tematica_id, horas_catedra, activo) VALUES
    (1, 'CONF_APERTURA', 'Apertura Oficial y Conferencia Magistral', 'Acto de bienvenida y apertura institucional', 1, 5, 2, TRUE),
    (2, 'TAL_CIBERSEG', 'Taller Hands-on: Ciberseguridad Defensiva', 'Prácticas de hardening y respuesta a incidentes en entornos educativos', 3, 2, 4, TRUE),
    (3, 'PAN_IA_IFTS', 'Panel: Inteligencia Artificial en la Formación Técnica', 'Desafíos curriculares y adopción en IFTS', 2, 1, 2, TRUE),
    (4, 'MST_CLOUD_DEV', 'Masterclass: Arquitecturas Cloud y DevOps', 'Diseño de aplicaciones escalables modernas', 4, 3, 3, TRUE),
    (5, 'MES_LABORAL', 'Mesa de Debate: Inserción Laboral y Prácticas Profesionalizantes', 'Articulación entre institutos técnicos y el sector productivo tecnológico', 2, 5, 2, TRUE)
ON CONFLICT (id) DO UPDATE
SET codigo = EXCLUDED.codigo, nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, tipo_acreditacion_id = EXCLUDED.tipo_acreditacion_id, categoria_tematica_id = EXCLUDED.categoria_tematica_id, horas_catedra = EXCLUDED.horas_catedra;

SELECT setval('catalogo_actividades_id_seq', (SELECT GREATEST(MAX(id), 5) FROM catalogo_actividades));

-- 8. Operadores Iniciales (Contraseñas verificadas: SuperAdmin2026!, AdminCongreso2026!, Verificador2026!, Operador2026!)
INSERT INTO operadores (id, nombre, apellido, email_institucional, punto_acceso_default_id, rol_id, password_hash, activo) VALUES
    (1, 'Operador 1', 'Puerta Principal', 'operador1.puerta@bue.edu.ar', 1, 5, 'f1632a3a69e39b75fb676f62f71ddd05:31dcbfa06756fe2c2572106ddee4281cb7bc2afe1f14d19c52b4e89881ade7535529014ead82874555b594103f6e2a14c0a9ac53d167f526db5405d1471f3e24', TRUE),
    (2, 'Operador 2', 'Puerta Lateral', 'operador2.lateral@bue.edu.ar', 2, 5, 'f1632a3a69e39b75fb676f62f71ddd05:31dcbfa06756fe2c2572106ddee4281cb7bc2afe1f14d19c52b4e89881ade7535529014ead82874555b594103f6e2a14c0a9ac53d167f526db5405d1471f3e24', TRUE),
    (3, 'Verificador', 'DETS Pergaminos', 'verificador.dets@bue.edu.ar', 1, 6, '44c469df76fecee690c07b633331da48:0cbf5c2c03edb00b9fbdc2baa7f068bc3686e2045526e1c9d7b4e2839a548b27e269ba1126713a66609f54791fe81c7a30f1f2f9d7f249f6627a230b3e132771', TRUE),
    (4, 'Administrador', 'General DETS', 'admin@ifts04.edu.ar', 1, 7, '7fb016d32baac8bd87ca40fa44730ac7:7d9d68a28136efb5862f74f50fa3f079a4fc8a57cb921ec449ed4bc592189abbf44df9982064136e95f015a6cd57be66fc56924552cb50c5710f73e6283f70ec', TRUE),
    (5, 'Superadmin', 'General', 'superadmin.congreso@bue.edu.ar', 1, 8, 'ab49ee1302926d6c9f1181b5af90ea0c:d272c16d26ec037337729b78477f3a16923e763e934f3b443b164b529fa862a4057368f6a782d2a644ff835410a25062c291fcb8ecd0ceb682cd29b4d6fd392f', TRUE)
ON CONFLICT (email_institucional) DO UPDATE
SET nombre = EXCLUDED.nombre, apellido = EXCLUDED.apellido, rol_id = EXCLUDED.rol_id, password_hash = EXCLUDED.password_hash, activo = EXCLUDED.activo;

SELECT setval('operadores_id_seq', (SELECT GREATEST(MAX(id), 5) FROM operadores));

-- 9. Actividades e Instancias del Evento
INSERT INTO actividades (id, evento_id, nombre, descripcion, tipo_acreditacion_id, punto_acceso_id, cupo_maximo, horario_inicio, horario_fin, disertante_nombre, catalogo_actividad_id) VALUES
    (1, 1, 'Acreditación General y Café de Bienvenida', 'Recepción de asistentes, entrega de credenciales y café de bienvenida institucional', 1, 1, 500, '2026-11-06 08:30:00-03', '2026-11-06 09:30:00-03', 'Personal de Acreditación DETS', NULL),
    (2, 1, 'Apertura Oficial y Conferencia Magistral', 'Acto de bienvenida y apertura institucional', 1, 3, 400, '2026-11-06 09:30:00-03', '2026-11-06 10:30:00-03', 'Autoridades DETS y Ministerio', 1),
    (3, 1, 'Taller Hands-on: Ciberseguridad Defensiva', 'Prácticas de hardening y respuesta a incidentes en entornos educativos', 3, 6, 35, '2026-11-06 11:00:00-03', '2026-11-06 13:00:00-03', 'Ing. Marcos Benítez', 2),
    (4, 1, 'Panel: Inteligencia Artificial en la Formación Técnica', 'Desafíos curriculares y adopción en IFTS', 2, 5, 60, '2026-11-06 14:00:00-03', '2026-11-06 16:00:00-03', 'Lic. Valeria Rossi', 3),
    (5, 1, 'Masterclass: Arquitecturas Cloud y DevOps', 'Diseño de aplicaciones escalables modernas', 4, 3, 120, '2026-11-06 16:30:00-03', '2026-11-06 18:00:00-03', 'Dr. Esteban Guida', 4),
    (6, 1, 'Mesa de Debate: Inserción Laboral y Prácticas Profesionalizantes en IFTS', 'Articulación entre institutos técnicos y el sector productivo tecnológico', 2, 4, 100, '2026-11-06 16:45:00-03', '2026-11-06 18:00:00-03', 'Directivos de IFTS y Cámaras Tecnológicas', 5)
ON CONFLICT (id) DO UPDATE
SET evento_id = EXCLUDED.evento_id, nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, cupo_maximo = EXCLUDED.cupo_maximo, catalogo_actividad_id = EXCLUDED.catalogo_actividad_id;

SELECT setval('actividades_id_seq', (SELECT GREATEST(MAX(id), 6) FROM actividades));

-- 10. Configuraciones de Funcionamiento del Sistema
INSERT INTO configuraciones_sistema (clave, valor, descripcion, categoria) VALUES
    ('aforo_maximo_confirmados', '{"cupo": 400}', 'Límite máximo de inscripciones confirmadas automáticas', 'GENERAL'),
    ('ventana_reconfirmacion_horas', '{"pre_evento_horas": 48, "vigencia_token_horas": 24}', 'Plazos para el envío de correos de confirmación y expiración', 'GENERAL'),
    ('cron_backup_automatico', '{"activo": true, "frecuencia": "0 2 * * *", "retencion_dias": 15, "directorio": "./backups", "nocturno_activo": true, "nocturno_hora": "02:00", "diurno_activo": true, "diurno_intervalo_min": 30, "diurno_inicio": "08:00", "diurno_fin": "19:00"}', 'Programación y retención de backups automáticos', 'BACKUP'),
    ('repositorio_git', '{"ruta_local": "C:\\\\Congreso2026", "remoto_url": "", "rama_default": "main", "sincronizacion_automatica": false}', 'Parámetros del repositorio Git local y sincronización con remoto', 'GIT'),
    ('politica_acreditacion', '{"exigir_dni_fisico": true, "mostrar_foto_operador": true, "reloj_animado_credencial": true}', 'Políticas de seguridad operativa en puerta', 'SEGURIDAD')
ON CONFLICT (clave) DO UPDATE 
SET valor = EXCLUDED.valor, descripcion = EXCLUDED.descripcion, categoria = EXCLUDED.categoria;

-- 11. Encuesta Modelo Inicial
INSERT INTO encuestas (id, evento_id, titulo, descripcion, etapa, es_obligatoria, activa)
VALUES (
    1,
    1,
    'Sondeo de Intereses y Preferencias Temáticas ETS 2026/2027',
    'Ayúdanos a priorizar los próximos talleres, masterclasses y disertaciones técnicas.',
    'INSCRIPCION',
    FALSE,
    TRUE
)
ON CONFLICT (id) DO UPDATE
SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion, etapa = EXCLUDED.etapa;

SELECT setval('encuestas_id_seq', (SELECT GREATEST(MAX(id), 1) FROM encuestas));

INSERT INTO encuesta_preguntas (id, encuesta_id, orden, texto_pregunta, tipo_pregunta, es_obligatoria, peso_ponderacion)
VALUES 
    (1, 1, 1, '¿Cuáles de las siguientes áreas técnicas consideras fundamentales para tu desarrollo profesional?', 'OPCION_MULTIPLE', TRUE, 1.20),
    (2, 1, 2, '¿Qué nivel de interés tienes en profundizar sobre Inteligencia Artificial aplicada en la industria?', 'CALIFICACION_1_A_5', FALSE, 1.00),
    (3, 1, 3, '¿Qué temática o taller específico te gustaría que se incorpore en la próxima edición?', 'TEXTO_ABIERTO', FALSE, 1.00)
ON CONFLICT (id) DO UPDATE
SET texto_pregunta = EXCLUDED.texto_pregunta;

SELECT setval('encuesta_preguntas_id_seq', (SELECT GREATEST(MAX(id), 3) FROM encuesta_preguntas));

INSERT INTO encuesta_opciones (id, pregunta_id, categoria_tematica_id, orden, texto_opcion, valor_ponderacion) VALUES
    (1, 1, 1, 1, 'Inteligencia Artificial y Modelos Predictivos', 1.00),
    (2, 1, 2, 2, 'Ciberseguridad Ofensiva y Defensiva', 1.00),
    (3, 1, 3, 3, 'Desarrollo Cloud & Microservicios', 1.00),
    (4, 1, 4, 4, 'Robótica e Internet de las Cosas (IoT)', 1.00),
    (5, 1, 5, 5, 'Prácticas Profesionalizantes e Inserción en Empresas', 1.00)
ON CONFLICT (id) DO UPDATE
SET texto_opcion = EXCLUDED.texto_opcion;

SELECT setval('encuesta_opciones_id_seq', (SELECT GREATEST(MAX(id), 5) FROM encuesta_opciones));

-- 12. Usuarios Participantes de Demostración (Inscriptos Oficiales)
INSERT INTO usuarios (dni_pasaporte, evento_id, nombre, apellido, email, celular, rol_principal_id, estado_inscripcion_id) VALUES
    ('30111222', 1, 'Juan Carlos', 'Pérez', 'juan.perez@alumnos.buenosaires.gob.ar', '1145678901', 2, 1),
    ('28333444', 1, 'Mariana Laura', 'González', 'mariana.gonzalez@docentes.buenosaires.gob.ar', '1156789012', 3, 1),
    ('35555666', 1, 'Nicolás Martín', 'Romero', 'nicolas.romero@gmail.com', '1167890123', 1, 1)
ON CONFLICT (dni_pasaporte, evento_id) DO UPDATE
SET nombre = EXCLUDED.nombre, apellido = EXCLUDED.apellido, email = EXCLUDED.email;