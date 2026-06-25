-- Migración: Agregar columnas de abono a facturas
-- Ejecutar en Supabase SQL Editor

ALTER TABLE facturas 
ADD COLUMN IF NOT EXISTS monto_abonado DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_pendiente DECIMAL(10,2) DEFAULT 0;

-- Actualizar facturas existentes para calcular saldo_pendiente
UPDATE facturas 
SET saldo_pendiente = total - monto_abonado 
WHERE saldo_pendiente = 0 AND monto_abonado > 0;

UPDATE facturas 
SET saldo_pendiente = total 
WHERE saldo_pendiente = 0 AND monto_abonado = 0;
