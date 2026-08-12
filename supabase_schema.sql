-- ====================================================================
-- ESQUEMA DE BASE DE DATOS POSTGRESL / SUPABASE - PRUANED A.G.
-- Cumplimiento Decreto Ley N° 2.757 y Ley N° 21.719 (Protección de Datos)
-- ====================================================================

-- 1. TABLA DE SOCIOS (Padrón Oficial DL 2757)
CREATE TABLE IF NOT EXISTS socios (
  id VARCHAR(50) PRIMARY KEY,
  rut VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  profesion VARCHAR(100),
  categoria VARCHAR(50) DEFAULT 'Socio Activo',
  voto BOOLEAN DEFAULT true,
  email VARCHAR(150),
  telefono VARCHAR(50),
  domicilio TEXT,
  region VARCHAR(100),
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  estado_cuota VARCHAR(50) DEFAULT 'Al Día',
  monto_cuota_mensual NUMERIC(10,2) DEFAULT 15000,
  cuota_incorporacion_pagada BOOLEAN DEFAULT false,
  monto_cuota_incorporacion NUMERIC(10,2) DEFAULT 30000,
  meses_adeudados INT DEFAULT 0,
  ultima_cuota_pagada VARCHAR(50),
  fecha_retiro_oficial DATE,
  acta_directorio_aprobacion VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE DONACIONES BANCARIAS (Transparencia & Balance)
CREATE TABLE IF NOT EXISTS donaciones (
  id VARCHAR(50) PRIMARY KEY,
  fecha DATE DEFAULT CURRENT_DATE,
  donante VARCHAR(150) NOT NULL,
  rut_o_documento VARCHAR(50),
  monto NUMERIC(12,2) NOT NULL,
  banco VARCHAR(100) DEFAULT 'BancoEstado Cta. Corriente PRUANED',
  numero_comprobante VARCHAR(100) NOT NULL,
  destino_aporte VARCHAR(150),
  publico BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE EGRESOS Y GASTOS (Tesorería)
CREATE TABLE IF NOT EXISTS egresos (
  id VARCHAR(50) PRIMARY KEY,
  fecha DATE DEFAULT CURRENT_DATE,
  tipo_documento VARCHAR(50) NOT NULL, -- Factura, Boleta, Comprobante
  numero_documento VARCHAR(100) NOT NULL,
  proveedor VARCHAR(150) NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  categoria VARCHAR(100) NOT NULL, -- Insumos Médicos, Combustible, Albergues
  glosa TEXT,
  archivo_s3_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE POSTULACIONES DE NUEVOS SOCIOS
CREATE TABLE IF NOT EXISTS postulaciones (
  id VARCHAR(50) PRIMARY KEY,
  fecha_envio DATE DEFAULT CURRENT_DATE,
  estado VARCHAR(50) DEFAULT 'Pendiente Revisión Directorio',
  nombre_completo VARCHAR(150) NOT NULL,
  rut VARCHAR(20) NOT NULL,
  fecha_nacimiento DATE,
  email VARCHAR(150) NOT NULL,
  telefono VARCHAR(50),
  domicilio TEXT,
  comuna VARCHAR(100),
  profesion VARCHAR(100),
  nivel_estudios VARCHAR(100),
  experiencia_previa TEXT,
  formacion_certificada JSONB,
  razones_integracion TEXT,
  aporte_esperado TEXT,
  ha_participado_orgs VARCHAR(10),
  tiempo_disponible VARCHAR(50),
  areas_participacion JSONB,
  experiencias_complejas VARCHAR(10),
  descripcion_experiencias TEXT,
  necesita_apoyo_bienestar VARCHAR(20),
  tipo_apoyo_util TEXT,
  carta_intencion_s3_url TEXT,
  declaracion_veracidad VARCHAR(10),
  autorizacion_datos VARCHAR(10),
  acepta_ley_datos VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE VOLUNTARIOS & DISPONIBILIDAD OPERATIVA DE RECURSOS
CREATE TABLE IF NOT EXISTS voluntarios (
  id VARCHAR(50) PRIMARY KEY,
  rut VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'Voluntario Permanente',
  nivel_acreditacion VARCHAR(100),
  especialidad VARCHAR(100),
  region VARCHAR(100),
  email VARCHAR(150),
  telefono VARCHAR(50),
  horas_acumuladas INT DEFAULT 0,
  -- Registro de Disponibilidad y Recursos Propios
  disponibilidad_respuesta VARCHAR(50) DEFAULT 'Disponible de inmediato',
  recursos_propios JSONB, -- Vehículo 4x4, Remolque, Botiquín, Jaulas, etc.
  tareas_que_puede_realizar JSONB, -- Triage, Albergue, Transporte, Logística
  ultima_actualizacion_disponibilidad TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. AUDITORÍA DE SEGURIDAD (Security Logs)
CREATE TABLE IF NOT EXISTS security_logs (
  id VARCHAR(50) PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_email VARCHAR(150),
  ip_address VARCHAR(50),
  event_type VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'INFO'
);
