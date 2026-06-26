'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { formatCurrency } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function ReportesPage() {
  const { workers, facturas, accountingEntries, workerPayments } = useAppStore()
  const [filterMes, setFilterMes] = useState(() => new Date().toISOString().slice(0, 7))

  const reportesWorkers = useMemo(() => {
    const facturasDelMes = facturas.filter(f => f.fecha_emision?.startsWith(filterMes))
    const entriesDelMes = accountingEntries.filter(e => e.fecha?.startsWith(filterMes))

    const ingresosMes = entriesDelMes.filter(e => e.tipo === 'ingreso').reduce((s, e) => s + e.monto, 0)
    const comisionesMes = entriesDelMes.reduce((s, e) => s + (e.banco_fee || 0), 0)
    const gastosOperativos = entriesDelMes.filter(e => e.tipo === 'egreso' && !e.worker_id).reduce((s, e) => s + e.monto, 0)
    const pagosWorkers = workerPayments.filter(wp => wp.mes === filterMes && wp.pagado).reduce((s, wp) => s + wp.monto_total, 0)
    const utilidadNeta = ingresosMes - comisionesMes - gastosOperativos - pagosWorkers
    const margen = ingresosMes > 0 ? (utilidadNeta / ingresosMes) * 100 : 0

    const workerStats = workers.map(w => {
      const itemsDelWorker = facturasDelMes
        .flatMap(f => f.items || [])
        .filter(item => item.worker_id === w.id)

      const horas = itemsDelWorker.reduce((s, i) => s + (i.horas_reales || (i.servicio?.horas_estimadas || 0) * (i.cantidad || 1) || 0), 0)
      const ingresosGenerados = itemsDelWorker.reduce((s, i) => s + i.subtotal, 0)
      const costos = horas * w.costo_hora
      const utilidad = ingresosGenerados - costos

      return {
        nombre: w.nombre,
        tipo: w.tipo === 'interno' ? 'Interno' : 'Freelancer',
        horas,
        ingresosGenerados,
        costos,
        utilidad,
        activo: w.activo
      }
    }).filter(w => w.horas > 0 || w.ingresosGenerados > 0)

    return { workerStats, ingresosMes, comisionesMes, gastosOperativos, pagosWorkers, utilidadNeta, margen }
  }, [workers, facturas, accountingEntries, workerPayments, filterMes])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Reportes" subtitle="Análisis de trabajadores y utilidades" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <input
            type="month"
            value={filterMes}
            onChange={(e) => setFilterMes(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:outline-none focus:ring-2 focus:ring-willou-orange/20"
          />
        </div>

        {/* P&L Summary */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-willou-dark mb-4">P&L del Mes</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-green-50">
                <p className="text-sm text-willou-gray">Ingresos</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(reportesWorkers.ingresosMes)}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50">
                <p className="text-sm text-willou-gray">Comisiones</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(reportesWorkers.comisionesMes)}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50">
                <p className="text-sm text-willou-gray">Gastos Operativos</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(reportesWorkers.gastosOperativos)}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50">
                <p className="text-sm text-willou-gray">Pago Workers</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(reportesWorkers.pagosWorkers)}</p>
              </div>
              <div className="p-4 rounded-xl bg-willou-purple/20">
                <p className="text-sm text-willou-gray">Utilidad Neta</p>
                <p className={`text-xl font-bold ${reportesWorkers.utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(reportesWorkers.utilidadNeta)}
                </p>
                <p className={`text-xs ${reportesWorkers.margen >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {reportesWorkers.margen.toFixed(1)}% margen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico P&L */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-willou-dark mb-4">Composición del P&L</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Ingresos', valor: reportesWorkers.ingresosMes },
                  { name: 'Comisiones', valor: -reportesWorkers.comisionesMes },
                  { name: 'Gastos', valor: -reportesWorkers.gastosOperativos },
                  { name: 'Workers', valor: -reportesWorkers.pagosWorkers },
                  { name: 'Utilidad', valor: reportesWorkers.utilidadNeta },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => typeof value === 'number' ? formatCurrency(value) : value} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {[
                      { fill: '#22c55e' },
                      { fill: '#ef4444' },
                      { fill: '#f59e0b' },
                      { fill: '#fb5a2e' },
                      { fill: reportesWorkers.utilidadNeta >= 0 ? '#22c55e' : '#ef4444' },
                    ].map((entry, index) => (
                      <Bar key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {reportesWorkers.workerStats.length === 0 ? (
          <EmptyState icon="📈" title="Sin datos para este mes" description="No hay actividad de trabajadores en este período" />
        ) : (
          <>
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-willou-dark mb-4">Rendimiento por Trabajador</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-willou-gray">Trabajador</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-willou-gray">Tipo</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-willou-gray">Horas</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-willou-gray">Ingresos</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-willou-gray">Costo</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-willou-gray">Utilidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportesWorkers.workerStats.map((w, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm font-medium text-willou-dark">{w.nombre}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${w.tipo === 'Interno' ? 'bg-willou-orange/20 text-orange-800' : 'bg-willou-purple/40 text-willou-dark'}`}>
                              {w.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-willou-dark">{w.horas.toFixed(1)}h</td>
                          <td className="py-3 px-4 text-sm text-right text-green-600 font-medium">{formatCurrency(w.ingresosGenerados)}</td>
                          <td className="py-3 px-4 text-sm text-right text-red-600">{formatCurrency(w.costos)}</td>
                          <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(w.utilidad)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-willou-dark mb-4">Utilidad por Trabajador</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportesWorkers.workerStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: any) => typeof value === 'number' ? formatCurrency(value) : value} />
                      <Legend />
                      <Bar dataKey="ingresosGenerados" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="costos" name="Costo Worker" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="utilidad" name="Utilidad" fill="#fb5a2e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
