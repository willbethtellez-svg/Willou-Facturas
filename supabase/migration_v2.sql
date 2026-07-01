-- =============================================
-- MIGRATION V2: Agency Management System
-- =============================================

-- 1. TABLA: Workers (Empleados y Freelancers)
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('interno', 'freelancer')) NOT NULL DEFAULT 'freelancer',
  costo_hora DECIMAL(10,2) DEFAULT 0,
  telefono VARCHAR(50),
  correo VARCHAR(255),
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABLA: Expense Categories (Categorías de Gastos)
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('operativo', 'inversion', 'otro')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. TABLA: Accounting Entries (Libro Contable)
CREATE TABLE IF NOT EXISTS accounting_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo VARCHAR(10) CHECK (tipo IN ('ingreso', 'egreso')) NOT NULL,
  categoria_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  monto DECIMAL(10,2) NOT NULL,
  banco_fee DECIMAL(10,2) DEFAULT 0,
  factura_id UUID REFERENCES facturas(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. AGREGAR columnas de pricing a servicios
ALTER TABLE servicios
ADD COLUMN IF NOT EXISTS horas_estimadas DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS costo_hora_agencia DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS porcentaje_utilidad DECIMAL(5,2) DEFAULT 30,
ADD COLUMN IF NOT EXISTS precio_sugerido DECIMAL(10,2);

-- 5. AGREGAR columnas de pricing + workers a factura_items
ALTER TABLE factura_items
ADD COLUMN IF NOT EXISTS pricing_mode VARCHAR(20) DEFAULT 'fijo',
ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS horas_reales DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS costo_worker DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS costo_operativo DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS porcentaje_utilidad DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS utilidad_amount DECIMAL(10,2);

-- 6. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_workers_activo ON workers(activo);
CREATE INDEX IF NOT EXISTS idx_workers_tipo ON workers(tipo);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_fecha ON accounting_entries(fecha);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_tipo ON accounting_entries(tipo);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_factura ON accounting_entries(factura_id);

-- 7. TRIGGER: updated_at para workers
DROP TRIGGER IF EXISTS update_workers_updated_at ON workers;
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. TRIGGER: updated_at para accounting_entries
DROP TRIGGER IF EXISTS update_accounting_entries_updated_at ON accounting_entries;
CREATE TRIGGER update_accounting_entries_updated_at BEFORE UPDATE ON accounting_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. RLS POLICIES
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anonymous" ON workers;
DROP POLICY IF EXISTS "Allow all for anonymous" ON expense_categories;
DROP POLICY IF EXISTS "Allow all for anonymous" ON accounting_entries;

CREATE POLICY "Allow all for anonymous" ON workers FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON expense_categories FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON accounting_entries FOR ALL USING (true);

-- 10. SEED DATA: Categorías de gastos
INSERT INTO expense_categories (nombre, tipo) VALUES
  ('Suscripciones', 'operativo'),
  ('Hosting y Dominios', 'operativo'),
  ('Software y Herramientas', 'operativo'),
  ('Publicidad y Marketing', 'operativo'),
  ('Comisiones Bancarias', 'operativo'),
  ('Material de Oficina', 'operativo'),
  ('Servicios Públicos', 'operativo'),
  ('Equipos y Hardware', 'inversion'),
  ('Mobiliario', 'inversion'),
  ('Capacitación', 'inversion'),
  ('Transporte', 'otro'),
  ('Otros Gastos', 'otro')
ON CONFLICT DO NOTHING;
