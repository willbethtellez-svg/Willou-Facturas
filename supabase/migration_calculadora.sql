-- ============================================================
-- Migration: Calculadora de Costos (v2.5)
-- ============================================================

-- 1. Tabla costos_operativos
CREATE TABLE costos_operativos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('mensual', 'trimestral', 'anual')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE costos_operativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anonymous" ON costos_operativos FOR ALL USING (true);

CREATE TRIGGER update_costos_operativos_updated_at
  BEFORE UPDATE ON costos_operativos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Agregar campos a configuracion
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS ingreso_mensual_deseado DECIMAL(10,2) DEFAULT 5000;
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS margen_freelancer DECIMAL(5,2) DEFAULT 30;

-- 3. Agregar campo a workers
ALTER TABLE workers ADD COLUMN IF NOT EXISTS horas_disponibles_mes DECIMAL(6,2) DEFAULT 160;

-- 4. Datos iniciales de ejemplo (opcionales, comenta si no los quieres)
-- INSERT INTO costos_operativos (nombre, monto, frecuencia) VALUES
--   ('Internet', 80, 'mensual'),
--   ('Luz', 150, 'mensual'),
--   ('Hosting/Servidor', 50, 'mensual'),
--   ('Software Adobe', 600, 'anual'),
--   ('Coworking', 200, 'trimestral');
