import { create } from 'zustand';
import { Cliente, Servicio, Factura, Configuracion } from '@/types';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;

  // Config
  configuracion: Configuracion | null;
  setConfiguracion: (config: Configuracion) => void;

  // Clientes
  clientes: Cliente[];
  setClientes: (clientes: Cliente[]) => void;
  addCliente: (cliente: Cliente) => void;
  updateCliente: (cliente: Cliente) => void;
  deleteCliente: (id: string) => void;

  // Servicios
  servicios: Servicio[];
  setServicios: (servicios: Servicio[]) => void;
  addServicio: (servicio: Servicio) => void;
  updateServicio: (servicio: Servicio) => void;
  deleteServicio: (id: string) => void;

  // Facturas
  facturas: Factura[];
  setFacturas: (facturas: Factura[]) => void;
  addFactura: (factura: Factura) => void;
  updateFactura: (factura: Factura) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),

  // Config
  configuracion: null,
  setConfiguracion: (config) => set({ configuracion: config }),

  // Clientes
  clientes: [],
  setClientes: (clientes) => set({ clientes }),
  addCliente: (cliente) => set((state) => ({ clientes: [...state.clientes, cliente] })),
  updateCliente: (cliente) => set((state) => ({
    clientes: state.clientes.map((c) => (c.id === cliente.id ? cliente : c)),
  })),
  deleteCliente: (id) => set((state) => ({
    clientes: state.clientes.filter((c) => c.id !== id),
  })),

  // Servicios
  servicios: [],
  setServicios: (servicios) => set({ servicios }),
  addServicio: (servicio) => set((state) => ({ servicios: [...state.servicios, servicio] })),
  updateServicio: (servicio) => set((state) => ({
    servicios: state.servicios.map((s) => (s.id === servicio.id ? servicio : s)),
  })),
  deleteServicio: (id) => set((state) => ({
    servicios: state.servicios.filter((s) => s.id !== id),
  })),

  // Facturas
  facturas: [],
  setFacturas: (facturas) => set({ facturas }),
  addFactura: (factura) => set((state) => ({ facturas: [...state.facturas, factura] })),
  updateFactura: (factura) => set((state) => ({
    facturas: state.facturas.map((f) => (f.id === factura.id ? factura : f)),
  })),
}));
