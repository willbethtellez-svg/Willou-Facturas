-- =============================================
-- SCHEMA: FACTURAS WILLOU
-- =============================================

-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: Configuración
-- =============================================
CREATE TABLE configuracion (
  id INTEGER PRIMARY KEY DEFAULT 1,
  numero_factura_actual INTEGER DEFAULT 153,
  iva_porcentaje DECIMAL(5,2) DEFAULT 16.00,
  nombre_empresa VARCHAR(255) DEFAULT 'willou',
  direccion_empresa TEXT DEFAULT 'Urbanización la Haciendita EDF Caura 2122 Cagua, Aragua',
  telefono_empresa VARCHAR(50) DEFAULT '+1 (641) 643-9019',
  correo_empresa VARCHAR(255) DEFAULT 'info@willou.com',
  logo_url TEXT,
  color_principal VARCHAR(20) DEFAULT '#fb5a2e',
  color_secundario VARCHAR(20) DEFAULT '#d7bdff',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- =============================================
-- TABLA: Clientes
-- =============================================
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  empresa VARCHAR(255),
  direccion TEXT,
  cif VARCHAR(50),
  correo VARCHAR(255),
  telefono VARCHAR(50),
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABLA: Servicios/Productos
-- =============================================
CREATE TABLE servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABLA: Facturas
-- =============================================
CREATE TABLE facturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(10) NOT NULL UNIQUE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  fecha_emision DATE DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'cancelada')),
  subtotal DECIMAL(10,2) DEFAULT 0,
  iva_porcentaje DECIMAL(5,2) DEFAULT 0,
  iva_monto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABLA: Items de Factura
-- =============================================
CREATE TABLE factura_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factura_id UUID REFERENCES facturas(id) ON DELETE CASCADE,
  servicio_id UUID REFERENCES servicios(id) ON DELETE SET NULL,
  descripcion TEXT,
  cantidad INTEGER DEFAULT 1,
  precio_unitario DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABLA: Assets/Recursos
-- =============================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('logo', 'fondo', 'imagen', 'otro')),
  url TEXT NOT NULL,
  archivo_original VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX idx_facturas_estado ON facturas(estado);
CREATE INDEX idx_facturas_fecha ON facturas(fecha_emision);
CREATE INDEX idx_factura_items_factura ON factura_items(factura_id);

-- =============================================
-- TRIGGERS: Actualizar updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at BEFORE UPDATE ON servicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facturas_updated_at BEFORE UPDATE ON facturas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar configuración por defecto
INSERT INTO configuracion (id, numero_factura_actual, iva_porcentaje, nombre_empresa)
VALUES (1, 153, 16.00, 'willou')
ON CONFLICT (id) DO NOTHING;

-- Insertar servicios de ejemplo
INSERT INTO servicios (nombre, descripcion, precio, categoria) VALUES
  ('Imágenes Listing', 'Fotografía profesional de productos para marketplace', 134.40, 'Fotografía'),
  ('Diseño de empaque', 'Diseño gráfico de empaque de producto', 70.00, 'Diseño'),
  ('Diseño Folleto', 'Diseño de material impreso promocional', 70.00, 'Diseño'),
  ('Modelado 3D', 'Modelado tridimensional de productos', 150.00, '3D'),
  ('Video de Producto', 'Video promocional de producto', 200.00, 'Video'),
  ('Diseño de Logo', 'Diseño de identidad visual de marca', 120.00, 'Branding'),
  ('Amazon Brand Store', 'Diseño de tienda oficial en Amazon', 180.00, 'E-commerce'),
  ('A+ Content', 'Contenido enhanced para Amazon', 100.00, 'E-commerce'),
  ('Brand Story', 'Historia de marca para marketplaces', 90.00, 'Branding')
ON CONFLICT DO NOTHING;

-- =============================================
-- POLÍTICAS RLS (Row Level Security)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Políticas para usuario anónimo (lectura/escritura para esta app)
CREATE POLICY "Allow all for anonymous" ON configuracion FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON clientes FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON servicios FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON facturas FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON factura_items FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON assets FOR ALL USING (true);
