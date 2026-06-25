'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { formatCurrency, formatDate } from '@/lib/supabase';

export default function DashboardPage() {
  const { facturas, clientes } = useAppStore();
  const [stats, setStats] = useState({
    totalFacturas: 0,
    facturasPagadas: 0,
    facturasPendientes: 0,
    totalCobrado: 0,
    totalPendiente: 0,
    facturasMes: 0,
    cobradoMes: 0,
  });

  useEffect(() => {
    // Calculate stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const facturasMes = facturas.filter(f => {
      const fecha = new Date(f.fecha_emision);
      return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
    });

    setStats({
      totalFacturas: facturas.length,
      facturasPagadas: facturas.filter(f => f.estado === 'pagada').length,
      facturasPendientes: facturas.filter(f => f.estado === 'pendiente').length,
      totalCobrado: facturas
        .filter(f => f.estado === 'pagada')
        .reduce((sum, f) => sum + f.total, 0),
      totalPendiente: facturas
        .filter(f => f.estado === 'pendiente')
        .reduce((sum, f) => sum + f.total, 0),
      facturasMes: facturasMes.length,
      cobradoMes: facturasMes
        .filter(f => f.estado === 'pagada')
        .reduce((sum, f) => sum + f.total, 0),
    });
  }, [facturas]);

  const statCards = [
    {
      title: 'Total Facturas',
      value: stats.totalFacturas,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-willou-purple',
    },
    {
      title: 'Pagadas',
      value: stats.facturasPagadas,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      color: 'bg-green-500',
    },
    {
      title: 'Pendientes',
      value: stats.facturasPendientes,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-yellow-500',
    },
    {
      title: 'Cobrado este mes',
      value: formatCurrency(stats.cobradoMes),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-willou-orange',
    },
  ];

  const recentInvoices = facturas.slice(0, 5);

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Resumen de tu facturación"
        actions={
          <Link href="/dashboard/facturas/nueva">
            <Button>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Factura
            </Button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-willou-gray">{stat.title}</p>
                  <p className="text-2xl font-bold text-willou-dark mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-willou-dark">Últimas Facturas</h2>
              <Link href="/dashboard/facturas" className="text-willou-orange hover:underline text-sm">
                Ver todas →
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {recentInvoices.length === 0 ? (
                <div className="px-6 py-8 text-center text-willou-gray">
                  No hay facturas aún
                </div>
              ) : (
                recentInvoices.map((factura) => (
                  <Link
                    key={factura.id}
                    href={`/dashboard/facturas/${factura.id}`}
                    className="block p-4 rounded-xl border border-gray-100 hover:border-willou-orange/30 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 gradient-willou rounded-xl flex items-center justify-center text-white font-bold text-sm">
                          {factura.numero}
                        </div>
                        <div>
                          <p className="font-semibold text-willou-dark">
                            {factura.cliente?.empresa || factura.cliente?.nombre || 'Sin cliente'}
                          </p>
                          <p className="text-sm text-willou-gray">
                            {formatDate(factura.fecha_emision)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-willou-dark text-lg">{formatCurrency(factura.total)}</p>
                          {factura.estado === 'pendiente' && factura.monto_abonado > 0 && (
                            <p className="text-xs text-willou-orange">
                              Abonado: {formatCurrency(factura.monto_abonado)}
                            </p>
                          )}
                        </div>
                        <Badge variant={factura.estado === 'pagada' ? 'success' : 'warning'}>
                          {factura.estado === 'pagada' ? 'Pagada' : factura.estado === 'cancelada' ? 'Cancelada' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Total Pending */}
          <Card className="card-hover">
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-willou-gray mb-2">Total Pendiente de Cobro</p>
                <p className="text-3xl font-bold text-willou-orange">{formatCurrency(stats.totalPendiente)}</p>
                <p className="text-sm text-willou-gray mt-2">
                  {stats.facturasPendientes} factura{stats.facturasPendientes !== 1 ? 's' : ''} pendiente{stats.facturasPendientes !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Collected */}
          <Card className="card-hover">
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-willou-gray mb-2">Total Cobrado (Histórico)</p>
                <p className="text-3xl font-bold text-green-500">{formatCurrency(stats.totalCobrado)}</p>
                <p className="text-sm text-willou-gray mt-2">
                  {stats.facturasPagadas} factura{stats.facturasPagadas !== 1 ? 's' : ''} cobrada{stats.facturasPagadas !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Clients */}
          <Card className="card-hover">
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-willou-gray mb-2">Total Clientes</p>
                <p className="text-3xl font-bold text-willou-purple">{clientes.length}</p>
                <Link href="/dashboard/clientes" className="text-sm text-willou-orange hover:underline mt-2 inline-block">
                  Ver todos →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
