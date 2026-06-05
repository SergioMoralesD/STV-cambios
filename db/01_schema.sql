-- Esquema PostgreSQL Portal B2B STV
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  session_timeout_min INT NOT NULL DEFAULT 480
);

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(100) UNIQUE NOT NULL,
  correo VARCHAR(255),
  pass_hash VARCHAR(255),
  rol_id INT NOT NULL REFERENCES roles(id),
  codigo_usuario VARCHAR(50),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE regiones (
  codigo CHAR(1) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
);

CREATE TABLE vistas (
  codigo VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  mostrar_juntas BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE delegaciones (
  codigo VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  region_codigo CHAR(1) NOT NULL REFERENCES regiones(codigo)
);

CREATE TABLE permisos_acceso (
  id SERIAL PRIMARY KEY,
  rol_id INT NOT NULL REFERENCES roles(id),
  region_codigo CHAR(1) NOT NULL REFERENCES regiones(codigo),
  vista_codigo VARCHAR(20) NOT NULL REFERENCES vistas(codigo),
  delegacion_codigo VARCHAR(20) NOT NULL REFERENCES delegaciones(codigo),
  UNIQUE (rol_id, region_codigo, vista_codigo, delegacion_codigo)
);

CREATE TABLE vistas_urls (
  region_codigo CHAR(1) NOT NULL REFERENCES regiones(codigo),
  vista_codigo VARCHAR(20) NOT NULL REFERENCES vistas(codigo),
  url TEXT NOT NULL,
  param_key VARCHAR(50) DEFAULT 'mainplant',
  joiner VARCHAR(5) DEFAULT '-',
  PRIMARY KEY (region_codigo, vista_codigo)
);

CREATE TABLE vista_islas (
  id SERIAL PRIMARY KEY,
  region_codigo CHAR(1) NOT NULL REFERENCES regiones(codigo),
  vista_codigo VARCHAR(20) NOT NULL REFERENCES vistas(codigo),
  label VARCHAR(100) NOT NULL,
  mainplant VARCHAR(50) NOT NULL
);

CREATE TABLE api_mock_data (
  endpoint_path VARCHAR(200) PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recursos_catalogo (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL
);

CREATE TABLE averias_incidencias (
  id TEXT PRIMARY KEY,
  carretera VARCHAR(50),
  kilometro NUMERIC(10, 2),
  isla VARCHAR(100),
  municipio VARCHAR(150),
  tipo_averia TEXT,
  prioridad VARCHAR(20),
  estado VARCHAR(30),
  fecha_reporte TIMESTAMPTZ,
  tecnico_asignado VARCHAR(150),
  payload JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE tecnicos (
  codigo VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  codigo_area VARCHAR(20),
  telefono VARCHAR(30),
  email VARCHAR(150)
);

CREATE INDEX idx_permisos_rol ON permisos_acceso(rol_id);
CREATE INDEX idx_api_mock_path ON api_mock_data(endpoint_path);
