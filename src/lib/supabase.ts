import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para formatear moneda
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper para formatear fecha
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper para obtener el próximo número de factura (sin incrementar)
export const getNextInvoiceNumber = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('configuracion')
    .select('numero_factura_actual')
    .single();

  if (error) throw error;

  const nextNumber = data.numero_factura_actual + 1;
  return String(nextNumber).padStart(4, '0');
};

// Helper para incrementar el contador de facturas (llamar al guardar)
export const incrementInvoiceCounter = async (): Promise<void> => {
  const { data, error } = await supabase
    .from('configuracion')
    .select('numero_factura_actual')
    .single();

  if (error) throw error;

  await supabase
    .from('configuracion')
    .update({ numero_factura_actual: data.numero_factura_actual + 1 })
    .eq('id', 1);
};

// Helper para obtener configuración
export const getConfiguracion = async () => {
  const { data, error } = await supabase
    .from('configuracion')
    .select('*')
    .single();

  if (error) throw error;
  return data;
};
