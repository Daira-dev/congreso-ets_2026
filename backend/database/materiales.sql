CREATE TABLE IF NOT EXISTS materiales (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (
        tipo IN ('novedad', 'documento', 'video', 'flyer', 'foto', 'recurso')
    ),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_publicacion DATE NOT NULL DEFAULT CURRENT_DATE,
    url_imagen TEXT,
    url_archivo TEXT,
    url_video TEXT,
    imagenes JSONB NOT NULL DEFAULT '[]'::jsonb,
    publicado BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materiales_evento
    ON materiales(evento_id);

CREATE INDEX IF NOT EXISTS idx_materiales_publicados
    ON materiales(evento_id, publicado, fecha_publicacion DESC);
