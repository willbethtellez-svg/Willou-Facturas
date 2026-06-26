import { create } from 'zustand';
import { Cliente, Servicio, Factura, Configuracion, Worker, ExpenseCategory, AccountingEntry, WorkerMonthlyPayment } from '@/types';

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
  deleteFactura: (id: string) => void;

  // Workers
  workers: Worker[];
  setWorkers: (workers: Worker[]) => void;
  addWorker: (worker: Worker) => void;
  updateWorker: (worker: Worker) => void;
  deleteWorker: (id: string) => void;

  // Expense Categories
  expenseCategories: ExpenseCategory[];
  setExpenseCategories: (categories: ExpenseCategory[]) => void;

  // Accounting Entries
  accountingEntries: AccountingEntry[];
  setAccountingEntries: (entries: AccountingEntry[]) => void;
  addAccountingEntry: (entry: AccountingEntry) => void;
  updateAccountingEntry: (entry: AccountingEntry) => void;
  deleteAccountingEntry: (id: string) => void;

  // Worker Payments
  workerPayments: WorkerMonthlyPayment[];
  setWorkerPayments: (payments: WorkerMonthlyPayment[]) => void;
  addWorkerPayment: (payment: WorkerMonthlyPayment) => void;
  updateWorkerPayment: (payment: WorkerMonthlyPayment) => void;
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
  deleteFactura: (id) => set((state) => ({
    facturas: state.facturas.filter((f) => f.id !== id),
  })),

  // Workers
  workers: [],
  setWorkers: (workers) => set({ workers }),
  addWorker: (worker) => set((state) => ({ workers: [...state.workers, worker] })),
  updateWorker: (worker) => set((state) => ({
    workers: state.workers.map((w) => (w.id === worker.id ? worker : w)),
  })),
  deleteWorker: (id) => set((state) => ({
    workers: state.workers.filter((w) => w.id !== id),
  })),

  // Expense Categories
  expenseCategories: [],
  setExpenseCategories: (categories) => set({ expenseCategories: categories }),

  // Accounting Entries
  accountingEntries: [],
  setAccountingEntries: (entries) => set({ accountingEntries: entries }),
  addAccountingEntry: (entry) => set((state) => ({
    accountingEntries: [...state.accountingEntries, entry],
  })),
  updateAccountingEntry: (entry) => set((state) => ({
    accountingEntries: state.accountingEntries.map((e) => (e.id === entry.id ? entry : e)),
  })),
  deleteAccountingEntry: (id) => set((state) => ({
    accountingEntries: state.accountingEntries.filter((e) => e.id !== id),
  })),

  // Worker Payments
  workerPayments: [],
  setWorkerPayments: (payments) => set({ workerPayments: payments }),
  addWorkerPayment: (payment) => set((state) => ({
    workerPayments: [...state.workerPayments, payment],
  })),
  updateWorkerPayment: (payment) => set((state) => ({
    workerPayments: state.workerPayments.map((p) => (p.id === payment.id ? payment : p)),
  })),
}));
