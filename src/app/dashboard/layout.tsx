'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { isAuthenticated } from '@/lib/auth';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { setAuthenticated, setConfiguracion, setClientes, setServicios, setFacturas, setWorkers, setExpenseCategories, setAccountingEntries, setWorkerPayments } = useAppStore();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    setAuthenticated(true);

    // Load data from Supabase
    const loadData = async () => {
      try {
        // Load configuration
        const { data: config } = await supabase
          .from('configuracion')
          .select('*')
          .single();
        if (config) setConfiguracion(config);

        // Load clients
        const { data: clientes } = await supabase
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: false });
        if (clientes) setClientes(clientes);

        // Load services
        const { data: servicios } = await supabase
          .from('servicios')
          .select('*')
          .order('created_at', { ascending: false });
        if (servicios) setServicios(servicios);

        // Load invoices
        const { data: facturas } = await supabase
          .from('facturas')
          .select('*, cliente:clientes(*), items:factura_items(*, servicio:servicios(*))')
          .order('created_at', { ascending: false });
        if (facturas) setFacturas(facturas);

        // Load workers
        const { data: workers } = await supabase
          .from('workers')
          .select('*')
          .order('created_at', { ascending: false });
        if (workers) setWorkers(workers);

        // Load expense categories
        const { data: categories } = await supabase
          .from('expense_categories')
          .select('*')
          .order('nombre', { ascending: true });
        if (categories) setExpenseCategories(categories);

        // Load accounting entries
        const { data: entries } = await supabase
          .from('accounting_entries')
          .select('*, categoria:expense_categories(*)')
          .order('fecha', { ascending: false });
        if (entries) setAccountingEntries(entries);

        // Load worker payments
        const { data: wPayments } = await supabase
          .from('worker_monthly_payments')
          .select('*, worker:workers(*)')
          .order('created_at', { ascending: false });
        if (wPayments) setWorkerPayments(wPayments);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-willou-lightgray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-willou-orange mx-auto mb-4"></div>
          <p className="text-willou-gray">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-willou-lightgray">
      <Sidebar />
      <main className="ml-64 p-8">
        <Toaster position="top-right" />
        {children}
      </main>
    </div>
  );
}
