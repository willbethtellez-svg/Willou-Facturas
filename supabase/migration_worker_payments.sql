-- =============================================
-- MIGRATION: Worker Monthly Payments
-- =============================================

CREATE TABLE IF NOT EXISTS worker_monthly_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  mes VARCHAR(7) NOT NULL,
  horas_total DECIMAL(6,2) DEFAULT 0,
  monto_total DECIMAL(10,2) DEFAULT 0,
  pagado BOOLEAN DEFAULT false,
  fecha_pago DATE,
  accounting_entry_id UUID REFERENCES accounting_entries(id) ON DELETE SET NULL,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_worker_payment_month
  ON worker_monthly_payments(worker_id, mes);

CREATE INDEX IF NOT EXISTS idx_worker_payments_mes ON worker_monthly_payments(mes);
CREATE INDEX IF NOT EXISTS idx_worker_payments_pagado ON worker_monthly_payments(pagado);

DROP TRIGGER IF EXISTS update_worker_monthly_payments_updated_at ON worker_monthly_payments;
CREATE TRIGGER update_worker_monthly_payments_updated_at BEFORE UPDATE ON worker_monthly_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE worker_monthly_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anonymous" ON worker_monthly_payments;
CREATE POLICY "Allow all for anonymous" ON worker_monthly_payments FOR ALL USING (true);
