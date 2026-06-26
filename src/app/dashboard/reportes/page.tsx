'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { formatCurrency } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function ReportesPage() {
  const { workers, facturas, accountingEntries } = useAppStore()
  const [filterMes, setFilterMes] = useState(() => new Date().toISOString().slice(0, 7))

  const reportesWorkers = useMemo(() => {
    const facturasDelMes = facturas.filter(f => f.fecha_emision?.startsWith(filterMes))
    const entriesDelMes = accountingEntries.filter(e => e.fecha?.startsWith(filterMes))

    const ingresosMes = entriesDelMes.filter(e => e.tipo === 'ingreso').reduce((s, e) => s + e.monto, 0)
    const egresosMes = entriesDelMes.filter(e => e.tipo === 'egreso').reduce((s, e) => s + e.monto, 0)
    const comisionesMes = entriesDelMes.reduce((s, e) => s + (e.banco_fee || 0), 0)
    const utilidadNeta = ingresosMes - egresosMes - comisionesMes

    const workerStats = workers.map(w => {
      const itemsDelWorker = facturasDelMes
        .flatMap(f => f.items || [])
        .filter(item => item.worker_id === w.id)

      const horas = itemsDelWorker.reduce((s, i) => s + (i.horas_reales || 0), 0)
      const ingresosGenerados = itemsDelWorker.reduce((s, i) => s + i.subtotal, 0)
      const costos = itemsDelWorker.reduce((s, i) => s + (i.costo_worker || 0), 0)
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

    return { workerStats, ingresosMes, egresosMes, comisionesMes, utilidadNeta }
  }, [workers, facturas, accountingEntries, filterMes])

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Ingresos del Mes</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(reportesWorkers.ingresosMes)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Egresos del Mes</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(reportesWorkers.egresosMes)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Comisiones</p>
              <p className="text-xl font-bold text-willou-gray">{formatCurrency(reportesWorkers.comisionesMes)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Utilidad Neta</p>
              <p className={`text-xl font-bold ${reportesWorkers.utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(reportesWorkers.utilidadNeta)}
              </p>
            </CardContent>
          </Card>
        </div>

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
                        <th className="text-right py-3 px-4 text-sm font-medium text-willou-gray">Costos</th>
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
                      <Bar dataKey="costos" name="Costos" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
