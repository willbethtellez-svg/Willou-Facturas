'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { supabase, formatCurrency } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function DistribucionPage() {
  const { workers, facturas, accountingEntries, workerPayments, updateWorkerPayment, addWorkerPayment, addAccountingEntry, updateFactura } = useAppStore()
  const [filterMes, setFilterMes] = useState(() => new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(false)
  const [editingHours, setEditingHours] = useState<Record<string, number | null>>({})
  const [savingHours, setSavingHours] = useState<string | null>(null)

  const facturasPagadas = useMemo(() => {
    return facturas.filter(f => f.estado === 'pagada' && f.fecha_emision?.startsWith(filterMes))
  }, [facturas, filterMes])

  const entriesDelMes = useMemo(() => {
    return accountingEntries.filter(e => e.fecha?.startsWith(filterMes))
  }, [accountingEntries, filterMes])

  const plData = useMemo(() => {
    const ingresos = entriesDelMes.filter(e => e.tipo === 'ingreso').reduce((s, e) => s + e.monto, 0)
    const comisiones = entriesDelMes.reduce((s, e) => s + (e.banco_fee || 0), 0)
    const gastosOperativos = entriesDelMes.filter(e => e.tipo === 'egreso' && !e.worker_id).reduce((s, e) => s + e.monto, 0)

    const pagosWorkers = workerPayments
      .filter(wp => wp.mes === filterMes && wp.pagado)
      .reduce((s, wp) => s + wp.monto_total, 0)

    const utilidad = ingresos - comisiones - gastosOperativos - pagosWorkers
    const margen = ingresos > 0 ? (utilidad / ingresos) * 100 : 0

    return { ingresos, comisiones, gastosOperativos, pagosWorkers, utilidad, margen }
  }, [entriesDelMes, workerPayments, filterMes])

  const workerDistribution = useMemo(() => {
    return workers.map(w => {
      const items = facturasPagadas
        .flatMap(f => (f.items || []).map(item => ({ ...item, factura_numero: f.numero, factura_id: f.id })))
        .filter(item => item.worker_id === w.id)

      const horasItems = items.map(item => {
        const horasReales = item.horas_reales
        const horasEstimadas = item.servicio?.horas_estimadas ? item.servicio.horas_estimadas * item.cantidad : 0
        return {
          ...item,
          horasCalculadas: horasReales || horasEstimadas
        }
      })

      const horasTotal = horasItems.reduce((s, i) => s + i.horasCalculadas, 0)
      const montoTotal = horasTotal * w.costo_hora

      const paymentRecord = workerPayments.find(wp => wp.worker_id === w.id && wp.mes === filterMes)

      return {
        worker: w,
        items: horasItems,
        horasTotal,
        montoTotal,
        pagado: paymentRecord?.pagado || false,
        paymentRecord
      }
    }).filter(w => w.items.length > 0)
  }, [workers, facturasPagadas, workerPayments, filterMes])

  const totalDistribuir = workerDistribution.reduce((s, w) => s + w.montoTotal, 0)
  const totalPagado = workerDistribution.filter(w => w.pagado).reduce((s, w) => s + w.montoTotal, 0)
  const totalPendiente = totalDistribuir - totalPagado

  const handleSaveHours = async (itemId: string, horasReales: number | null) => {
    setSavingHours(itemId)
    try {
      const { error } = await supabase
        .from('factura_items')
        .update({ horas_reales: horasReales })
        .eq('id', itemId)
      if (error) throw error

      // Update local state
      const updatedFacturas = facturas.map(f => ({
        ...f,
        items: f.items?.map(item =>
          item.id === itemId ? { ...item, horas_reales: horasReales } : item
        )
      }))
      // Force recalculation by updating a factura
      if (facturas.length > 0) {
        const factura = facturas.find(f => f.items?.some(item => item.id === itemId))
        if (factura) {
          updateFactura({ ...factura, updated_at: new Date().toISOString() })
        }
      }

      toast.success('Horas actualizadas')
    } catch (err) {
      console.error(err)
      toast.error('Error al guardar horas')
    } finally {
      setSavingHours(null)
      setEditingHours(prev => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
    }
  }

  const handleMarcarPagado = async (workerId: string, montoTotal: number, horasTotal: number) => {
    setLoading(true)
    try {
      const existing = workerPayments.find(wp => wp.worker_id === workerId && wp.mes === filterMes)

      const { data: entry } = await supabase
        .from('accounting_entries')
        .insert({
          fecha: new Date().toISOString().split('T')[0],
          tipo: 'egreso',
          monto: montoTotal,
          worker_id: workerId,
          descripcion: `Pago a ${workers.find(w => w.id === workerId)?.nombre} - ${filterMes}`
        })
        .select()
        .single()

      if (entry) addAccountingEntry(entry)

      if (existing) {
        const { error } = await supabase
          .from('worker_monthly_payments')
          .update({ pagado: true, fecha_pago: new Date().toISOString().split('T')[0], accounting_entry_id: entry?.id })
          .eq('id', existing.id)
        if (error) throw error
        updateWorkerPayment({ ...existing, pagado: true, fecha_pago: new Date().toISOString().split('T')[0], accounting_entry_id: entry?.id })
      } else {
        const { data: wp, error } = await supabase
          .from('worker_monthly_payments')
          .insert({
            worker_id: workerId,
            mes: filterMes,
            horas_total: horasTotal,
            monto_total: montoTotal,
            pagado: true,
            fecha_pago: new Date().toISOString().split('T')[0],
            accounting_entry_id: entry?.id
          })
          .select()
          .single()
        if (error) throw error
        if (wp) addWorkerPayment(wp)
      }

      toast.success('Pago registrado y entrada contable creada')
    } catch (err) {
      console.error(err)
      toast.error('Error al registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Distribución Mensual" subtitle="Pagos a trabajadores y P&L" />

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Ingresos</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(plData.ingresos)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Comisiones</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(plData.comisiones)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Gastos Operativos</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(plData.gastosOperativos)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Pago Workers</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(plData.pagosWorkers)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Utilidad Neta</p>
              <p className={`text-xl font-bold ${plData.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(plData.utilidad)}
              </p>
              <p className={`text-xs ${plData.margen >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {plData.margen.toFixed(1)}% margen
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resumen distribución */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Total a Distribuir</p>
              <p className="text-xl font-bold text-willou-dark">{formatCurrency(totalDistribuir)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Ya Pagado</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalPagado)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Pendiente</p>
              <p className="text-xl font-bold text-willou-orange">{formatCurrency(totalPendiente)}</p>
            </CardContent>
          </Card>
        </div>

        {workerDistribution.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Sin distribución este mes"
            description="No hay trabajadores asignados a facturas pagadas en este período"
          />
        ) : (
          <div className="space-y-6">
            {workerDistribution.map(({ worker: w, items, horasTotal, montoTotal, pagado, paymentRecord }) => (
              <Card key={w.id}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${w.tipo === 'interno' ? 'bg-willou-orange' : 'bg-willou-purple'}`}>
                        {w.tipo === 'interno' ? '👤' : '🆓'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-willou-dark">{w.nombre}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${w.tipo === 'interno' ? 'bg-willou-orange/20 text-orange-800' : 'bg-willou-purple/40 text-willou-dark'}`}>
                          {w.tipo === 'interno' ? 'Interno' : 'Freelancer'} — {formatCurrency(w.costo_hora)}/h
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-willou-gray">{horasTotal.toFixed(1)}h × {formatCurrency(w.costo_hora)}</p>
                      <p className="text-lg font-bold text-willou-dark">{formatCurrency(montoTotal)}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-xs font-medium text-willou-gray">Servicio</th>
                          <th className="text-left py-2 text-xs font-medium text-willou-gray">Factura</th>
                          <th className="text-right py-2 text-xs font-medium text-willou-gray">Horas</th>
                          <th className="text-right py-2 text-xs font-medium text-willou-gray">Monto</th>
                          <th className="w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const isEditing = item.id in editingHours
                          const horasReales = isEditing ? editingHours[item.id] : item.horas_reales
                          const horasDisplay = horasReales ?? item.horasCalculadas
                          const isSaving = savingHours === item.id

                          return (
                            <tr key={idx} className="border-b border-gray-50">
                              <td className="py-2 text-willou-dark">{item.descripcion || item.servicio?.nombre || 'Sin nombre'}</td>
                              <td className="py-2 text-willou-gray">#{item.factura_numero}</td>
                              <td className="py-2 text-right">
                                {isEditing ? (
                                  <div className="flex items-center gap-1 justify-end">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      value={editingHours[item.id] ?? ''}
                                      onChange={(e) => setEditingHours(prev => ({
                                        ...prev,
                                        [item.id]: e.target.value ? parseFloat(e.target.value) : null
                                      }))}
                                      className="w-20 px-2 py-1 text-right rounded-lg border border-willou-orange focus:outline-none focus:ring-2 focus:ring-willou-orange/20 text-sm"
                                      autoFocus
                                    />
                                    <span className="text-xs text-willou-gray">h</span>
                                  </div>
                                ) : (
                                  <span className="cursor-pointer hover:text-willou-orange transition-colors" onClick={() => setEditingHours(prev => ({ ...prev, [item.id]: item.horas_reales }))}>
                                    {horasDisplay.toFixed(1)}h
                                    {item.horas_reales === null && item.horasCalculadas > 0 && (
                                      <span className="text-xs text-willou-gray ml-1">(est)</span>
                                    )}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-right text-willou-dark">{formatCurrency(horasDisplay * w.costo_hora)}</td>
                              <td className="py-2 text-right">
                                {isEditing && (
                                  <button
                                    onClick={() => handleSaveHours(item.id!, editingHours[item.id])}
                                    disabled={isSaving}
                                    className="text-green-500 hover:text-green-700 text-xs font-medium disabled:opacity-50"
                                  >
                                    {isSaving ? '...' : '✓'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div>
                      {pagado ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          ✅ Pagado {paymentRecord?.fecha_pago ? `el ${new Date(paymentRecord.fecha_pago).toLocaleDateString('es-ES')}` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          ⏳ Pendiente
                        </span>
                      )}
                    </div>
                    {!pagado && (
                      <Button
                        onClick={() => handleMarcarPagado(w.id, montoTotal, horasTotal)}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        {loading ? 'Procesando...' : 'Marcar como Pagado'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Gráfico P&L */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-willou-dark mb-4">Composición del P&L</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Ingresos', valor: plData.ingresos, fill: '#22c55e' },
                  { name: 'Comisiones', valor: -plData.comisiones, fill: '#ef4444' },
                  { name: 'Gastos', valor: -plData.gastosOperativos, fill: '#f59e0b' },
                  { name: 'Workers', valor: -plData.pagosWorkers, fill: '#fb5a2e' },
                  { name: 'Utilidad', valor: plData.utilidad, fill: plData.utilidad >= 0 ? '#22c55e' : '#ef4444' },
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
                      { fill: plData.utilidad >= 0 ? '#22c55e' : '#ef4444' },
                    ].map((entry, index) => (
                      <Bar key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
