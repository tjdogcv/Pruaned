-- ============================================================
-- PRUANED A.G. — Esquema PostgreSQL para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── EXTENSIONES ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Búsqueda de texto eficiente

-- ── SOCIOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS socios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rut             VARCHAR(15) NOT NULL UNIQUE,
  nombre          TEXT NOT NULL,
  profesion       TEXT,
  categoria       TEXT NOT NULL DEFAULT 'Socio Activo'
                  CHECK (categoria IN ('Socio Activo','Socio Adherente','Socio Honorario')),
  voto            BOOLEAN DEFAULT TRUE,
  email           TEXT UNIQUE,
  region          TEXT,
  fecha_ingreso   DATE DEFAULT CURRENT_DATE,
  estado_cuota    TEXT DEFAULT 'En Mora',
  monto_cuota_mensual         INTEGER DEFAULT 5000,
  cuota_incorporacion_pagada  BOOLEAN DEFAULT FALSE,
  monto_cuota_incorporacion   INTEGER DEFAULT 30000,
  meses_adeudados             INTEGER DEFAULT 1,
  ultima_cuota_pagada         TEXT,
  permiso_gestion_voluntarios BOOLEAN DEFAULT FALSE,
  foto_perfil     TEXT,
  historial_pagos JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── VOLUNTARIOS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voluntarios (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rut                       VARCHAR(15) NOT NULL UNIQUE,
  nombre                    TEXT NOT NULL,
  email                     TEXT UNIQUE,
  telefono                  TEXT,
  region                    TEXT,
  fecha_ingreso             DATE DEFAULT CURRENT_DATE,
  nivel_acreditacion        TEXT DEFAULT 'Nivel 1 - Postulante (Inducción Básica)',
  horas_acumuladas          INTEGER DEFAULT 0,
  cursos_aprobados          JSONB DEFAULT '[]',
  disponibilidad_respuesta  TEXT,
  recursos_propios          TEXT,
  labores_que_puede_realizar TEXT,
  ultima_actualizacion_disponibilidad TIMESTAMPTZ,
  foto_perfil               TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ── CURSOS LMS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cursos_lms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(20) NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT,
  hours       INTEGER DEFAULT 10,
  level       TEXT DEFAULT 'Básico',
  modality    TEXT DEFAULT 'Online',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── DONACIONES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donaciones (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha            DATE NOT NULL,
  donante          TEXT NOT NULL,
  rut_donante      TEXT,
  n_comprobante    TEXT,
  destino_aporte   TEXT,
  monto_clp        INTEGER NOT NULL,
  estado           TEXT DEFAULT 'Confirmada',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  created_by       TEXT
);

-- ── EGRESOS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS egresos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha            DATE DEFAULT CURRENT_DATE,
  tipo_documento   TEXT DEFAULT 'Factura',
  numero_documento TEXT NOT NULL,
  proveedor        TEXT NOT NULL,
  monto            INTEGER NOT NULL,
  categoria        TEXT,
  glosa            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  created_by       TEXT
);

-- ── NOTICIAS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS noticias (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo      TEXT NOT NULL,
  contenido   TEXT,
  categoria   TEXT DEFAULT 'Institucional',
  autor       TEXT,
  imagen_url  TEXT,
  publicada   BOOLEAN DEFAULT TRUE,
  fecha       DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── DOCUMENTOS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo      TEXT NOT NULL,
  categoria   TEXT NOT NULL,
  descripcion TEXT,
  url         TEXT NOT NULL,
  fecha       DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── DIRECTORIO CARGOS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS directorio_cargos (
  id              SERIAL PRIMARY KEY,
  presidente_id   UUID REFERENCES socios(id),
  vicepresidente_id UUID REFERENCES socios(id),
  secretario_id   UUID REFERENCES socios(id),
  tesorero_id     UUID REFERENCES socios(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO directorio_cargos DEFAULT VALUES ON CONFLICT DO NOTHING;

-- ── FIRMAS OFICIALES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS firmas_oficiales (
  id                SERIAL PRIMARY KEY,
  presidente_firma  TEXT,
  secretario_firma  TEXT,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO firmas_oficiales DEFAULT VALUES ON CONFLICT DO NOTHING;

-- ── POSTULACIONES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS postulaciones (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha_envio           DATE DEFAULT CURRENT_DATE,
  estado                TEXT DEFAULT 'Pendiente Revisión Directorio',
  nombre_completo       TEXT NOT NULL,
  rut                   TEXT NOT NULL,
  fecha_nacimiento      DATE,
  email                 TEXT NOT NULL,
  telefono              TEXT,
  profesion             TEXT,
  razones_integracion   TEXT,
  formulario_completo   JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── REGISTRO DE AUDITORÍA ────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha       TIMESTAMPTZ DEFAULT NOW(),
  usuario     TEXT NOT NULL,
  evento      TEXT NOT NULL,
  label       TEXT,
  severidad   TEXT DEFAULT 'INFO' CHECK (severidad IN ('INFO','WARN','ERROR')),
  ip          TEXT,
  metadata    JSONB DEFAULT '{}'
);

-- ── CONVOCATORIA EMERGENCIA ──────────────────────────────────
CREATE TABLE IF NOT EXISTS convocatoria_activa (
  id              SERIAL PRIMARY KEY,
  activa          BOOLEAN DEFAULT FALSE,
  asunto          TEXT,
  mensaje         TEXT,
  fecha_despacho  TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO convocatoria_activa DEFAULT VALUES ON CONFLICT DO NOTHING;

-- ── CONFIGURACIÓN FINANCIERA ─────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion_financiera (
  id                        SERIAL PRIMARY KEY,
  cuota_mensual_actual       INTEGER DEFAULT 5000,
  cuota_incorporacion_actual INTEGER DEFAULT 30000,
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO configuracion_financiera DEFAULT VALUES ON CONFLICT DO NOTHING;

-- ── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_socios_rut    ON socios(rut);
CREATE INDEX IF NOT EXISTS idx_socios_email  ON socios(email);
CREATE INDEX IF NOT EXISTS idx_socios_nombre ON socios USING gin(nombre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voluntarios_rut ON voluntarios(rut);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha  ON auditoria(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario);
CREATE INDEX IF NOT EXISTS idx_donaciones_fecha  ON donaciones(fecha DESC);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE socios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE voluntarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE donaciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria         ENABLE ROW LEVEL SECURITY;
ALTER TABLE postulaciones     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "socios_auth"        ON socios        FOR ALL  USING (auth.role() = 'authenticated');
CREATE POLICY "voluntarios_auth"   ON voluntarios   FOR ALL  USING (auth.role() = 'authenticated');
CREATE POLICY "donaciones_auth"    ON donaciones     FOR ALL  USING (auth.role() = 'authenticated');
CREATE POLICY "egresos_auth"       ON egresos        FOR ALL  USING (auth.role() = 'authenticated');
CREATE POLICY "auditoria_read"     ON auditoria      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "postulaciones_ins"  ON postulaciones  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "postulaciones_read" ON postulaciones  FOR SELECT USING (auth.role() = 'authenticated');

-- ── TRIGGERS updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_socios_updated_at
  BEFORE UPDATE ON socios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_voluntarios_updated_at
  BEFORE UPDATE ON voluntarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ✅ Esquema listo para PRUANED A.G.
-- Próximo paso: Supabase → Authentication → Users
-- → Crear usuario: ag.pruaned@gmail.com
-- ============================================================
