export interface Configuracion {
  id: number;
  numero_factura_actual: number;
  iva_porcentaje: number;
  nombre_empresa: string;
  direccion_empresa: string;
  telefono_empresa: string;
  correo_empresa: string;
  logo_url: string | null;
  color_principal: string;
  color_secundario: string;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  empresa: string | null;
  direccion: string | null;
  cif: string | null;
  correo: string | null;
  telefono: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Factura {
  id: string;
  numero: string;
  cliente_id: string | null;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  estado: 'pendiente' | 'pagada' | 'cancelada';
  subtotal: number;
  iva_porcentaje: number;
  iva_monto: number;
  total: number;
  monto_abonado: number;
  saldo_pendiente: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
  items?: FacturaItem[];
}

export interface FacturaItem {
  id: string;
  factura_id: string;
  servicio_id: string | null;
  descripcion: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
  servicio?: Servicio;
}

export interface Asset {
  id: string;
  nombre: string;
  tipo: 'logo' | 'fondo' | 'imagen' | 'otro';
  url: string;
  archivo_original: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalFacturas: number;
  facturasPagadas: number;
  facturasPendientes: number;
  totalCobrado: number;
  totalPendiente: number;
  facturasMes: number;
  cobradoMes: number;
}

export interface FacturaFormData {
  cliente_id: string | null;
  fecha_emision: string;
  fecha_vencimiento: string;
  items: ItemFormData[];
  descuento_porcentaje: number;
  notas: string;
}

export interface ItemFormData {
  servicio_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}
