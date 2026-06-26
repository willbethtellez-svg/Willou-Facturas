'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { formatCurrency, formatDate } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#fb5a2e', '#d7bdff', '#232323', '#22c55e', '#ef4444', '#f59e0b']

export default function DashboardPage() {
  const { facturas, accountingEntries, workers, clientes } = useAppStore()

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const facturasMes = facturas.filter(f => {
      const fecha = new Date(f.fecha_emision)
      return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear
    })

    return {
      totalFacturas: facturas.length,
      facturasPagadas: facturas.filter(f => f.estado === 'pagada').length,
      facturasPendientes: facturas.filter(f => f.estado === 'pendiente').length,
      totalCobrado: facturas.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + f.total, 0),
      totalPendiente: facturas.filter(f => f.estado === 'pendiente').reduce((sum, f) => sum + f.total, 0),
      facturasMes: facturasMes.length,
      cobradoMes: facturasMes.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + f.total, 0),
    }
  }, [facturas])

  const monthlyData = useMemo(() => {
    const months: { name: string; ingresos: number; egresos: number }[] = []
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const mes = d.getMonth()
      const año = d.getFullYear()
      const prefix = `${año}-${String(mes + 1).padStart(2, '0')}`

      const ingresos = accountingEntries
        .filter(e => e.tipo === 'ingreso' && e.fecha?.startsWith(prefix))
        .reduce((s, e) => s + e.monto, 0)
      const egresos = accountingEntries
        .filter(e => e.tipo === 'egreso' && e.fecha?.startsWith(prefix))
        .reduce((s, e) => s + e.monto, 0)

      months.push({ name: monthNames[mes], ingresos, egresos })
    }
    return months
  }, [accountingEntries])

  const gastosPorCategoria = useMemo(() => {
    const cats: Record<string, number> = {}
    accountingEntries
      .filter(e => e.tipo === 'egreso')
      .forEach(e => {
        const nombre = e.categoria?.nombre || 'Sin categoría'
        cats[nombre] = (cats[nombre] || 0) + e.monto
      })
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
  }, [accountingEntries])

  const topWorkers = useMemo(() => {
    const now = new Date()
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    return workers
      .map(w => {
        const itemsDelWorker = facturas
          .filter(f => f.fecha_emision?.startsWith(prefix))
          .flatMap(f => f.items || [])
          .filter(item => item.worker_id === w.id)

        const horas = itemsDelWorker.reduce((s, i) => s + (i.horas_reales || 0), 0)
        const ingresos = itemsDelWorker.reduce((s, i) => s + i.subtotal, 0)
        return { ...w, horas, ingresos }
      })
      .filter(w => w.horas > 0 || w.ingresos > 0)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5)
  }, [workers, facturas])

  const statCards = [
    { title: 'Total Facturas', value: stats.totalFacturas, icon: '📄', color: 'bg-willou-purple' },
    { title: 'Pagadas', value: stats.facturasPagadas, icon: '✅', color: 'bg-green-500' },
    { title: 'Pendientes', value: stats.facturasPendientes, icon: '⏳', color: 'bg-yellow-500' },
    { title: 'Cobrado este mes', value: formatCurrency(stats.cobradoMes), icon: '💰', color: 'bg-willou-orange' },
  ]

  const recentInvoices = facturas.slice(0, 5)

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-willou-gray">{stat.title}</p>
                  <p className="text-2xl font-bold text-willou-dark mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} text-white text-xl`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-willou-dark mb-4">Ingresos vs Egresos (6 meses)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: any) => typeof value === 'number' ? formatCurrency(value) : value} />
                    <Legend />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-willou-dark mb-4">Gastos por Categoría</h2>
              {gastosPorCategoria.length === 0 ? (
                <div className="flex items-center justify-center h-56 text-willou-gray text-sm">Sin datos de gastos</div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gastosPorCategoria} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                        {gastosPorCategoria.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
<Tooltip formatter={(value: any) => typeof value === 'number' ? formatCurrency(value) : value} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-willou-dark">Últimas Facturas</h2>
              <Link href="/dashboard/facturas" className="text-willou-orange hover:underline text-sm">Ver todas →</Link>
            </div>
            <div className="p-4 space-y-3">
              {recentInvoices.length === 0 ? (
                <div className="px-6 py-8 text-center text-willow-gray">No hay facturas aún</div>
              ) : (
                recentInvoices.map((factura) => (
                  <Link key={factura.id} href={`/dashboard/facturas/${factura.id}`}
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
                          <p className="text-sm text-willou-gray">{formatDate(factura.fecha_emision)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-willou-dark text-lg">{formatCurrency(factura.total)}</p>
                          {factura.estado === 'pendiente' && factura.monto_abonado > 0 && (
                            <p className="text-xs text-willou-orange">Abonado: {formatCurrency(factura.monto_abonado)}</p>
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

        <div className="space-y-6">
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

          <Card className="card-hover">
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-willou-gray mb-2">Total Clientes</p>
                <p className="text-3xl font-bold text-willou-purple">{clientes.length}</p>
                <Link href="/dashboard/clientes" className="text-sm text-willou-orange hover:underline mt-2 inline-block">Ver todos →</Link>
              </div>
            </CardContent>
          </Card>

          {topWorkers.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-willou-dark mb-3">Top Workers del Mes</h3>
                <div className="space-y-2">
                  {topWorkers.map((w, i) => (
                    <div key={w.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-willou-orange/20 text-willou-orange text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="text-willou-dark">{w.nombre}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-willou-dark font-medium">{formatCurrency(w.ingresos)}</span>
                        {w.horas > 0 && <span className="text-willou-gray text-xs block">{w.horas}h</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
