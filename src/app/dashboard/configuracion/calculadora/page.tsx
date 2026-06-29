'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { supabase, formatCurrency } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import type { CostoOperativo } from '@/types'

export default function CalculadoraPage() {
  const { costosOperativos, addCostoOperativo, updateCostoOperativo, deleteCostoOperativo, configuracion, setConfiguracion, workers } = useAppStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [editingCosto, setEditingCosto] = useState<CostoOperativo | null>(null)
  const [deletingCosto, setDeletingCosto] = useState<CostoOperativo | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    monto: '',
    frecuencia: 'mensual' as 'mensual' | 'trimestral' | 'anual'
  })

  const [configForm, setConfigForm] = useState({
    ingreso_mensual_deseado: configuracion?.ingreso_mensual_deseado?.toString() || '5000',
    margen_freelancer: configuracion?.margen_freelancer?.toString() || '30'
  })

  const socios = workers.filter(w => w.tipo === 'interno' && w.activo)
  const [horasSocios, setHorasSocios] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    socios.forEach(s => {
      initial[s.id] = s.horas_disponibles_mes?.toString() || '160'
    })
    return initial
  })

  const costoMensualTotal = useMemo(() => {
    return costosOperativos.filter(c => c.activo).reduce((sum, c) => {
      if (c.frecuencia === 'mensual') return sum + c.monto
      if (c.frecuencia === 'trimestral') return sum + (c.monto / 3)
      return sum + (c.monto / 12)
    }, 0)
  }, [costosOperativos])

  const resumen = useMemo(() => {
    const ingresoDeseado = parseFloat(configForm.ingreso_mensual_deseado) || 0
    const margenFreelancer = parseFloat(configForm.margen_freelancer) || 30
    const totalGenerar = costoMensualTotal + ingresoDeseado

    const totalHorasSocios = socios.reduce((sum, s) => {
      return sum + (parseFloat(horasSocios[s.id]) || 0)
    }, 0)

    const costoHorasSocios = socios.reduce((sum, s) => {
      const horas = parseFloat(horasSocios[s.id]) || 0
      return sum + (horas * s.costo_hora)
    }, 0)

    const promedioCostoHoraSocios = totalHorasSocios > 0 ? costoHorasSocios / totalHorasSocios : 0

    const horasNecesarias = promedioCostoHoraSocios > 0
      ? Math.ceil(totalGenerar / promedioCostoHoraSocios)
      : 0

    return {
      costoMensualTotal,
      ingresoDeseado,
      margenFreelancer,
      totalGenerar,
      totalHorasSocios,
      horasNecesarias,
      costoHorasSocios,
      promedioCostoHoraSocios
    }
  }, [costoMensualTotal, configForm, socios, horasSocios])

  const handleOpenModal = (costo?: CostoOperativo) => {
    if (costo) {
      setEditingCosto(costo)
      setFormData({
        nombre: costo.nombre,
        monto: costo.monto.toString(),
        frecuencia: costo.frecuencia
      })
    } else {
      setEditingCosto(null)
      setFormData({ nombre: '', monto: '', frecuencia: 'mensual' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCosto(null)
    setFormData({ nombre: '', monto: '', frecuencia: 'mensual' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    if (!formData.monto || parseFloat(formData.monto) <= 0) { toast.error('El monto debe ser mayor a 0'); return }
    setLoading(true)

    const costoData = {
      nombre: formData.nombre.trim(),
      monto: parseFloat(formData.monto),
      frecuencia: formData.frecuencia
    }

    try {
      if (editingCosto) {
        const { error } = await supabase
          .from('costos_operativos')
          .update({ ...costoData, updated_at: new Date().toISOString() })
          .eq('id', editingCosto.id)
        if (error) throw error
        updateCostoOperativo({ ...editingCosto, ...costoData })
        toast.success('Costo actualizado')
      } else {
        const { data, error } = await supabase
          .from('costos_operativos')
          .insert([costoData])
          .select()
          .single()
        if (error) throw error
        addCostoOperativo(data)
        toast.success('Costo agregado')
      }
      handleCloseModal()
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCosto) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('costos_operativos')
        .delete()
        .eq('id', deletingCosto.id)
      if (error) throw error
      deleteCostoOperativo(deletingCosto.id)
      toast.success('Costo eliminado')
    } catch (error) {
      toast.error('Error al eliminar')
    } finally {
      setLoading(false)
      setIsConfirmOpen(false)
      setDeletingCosto(null)
    }
  }

  const handleSaveConfig = async () => {
    setLoading(true)
    try {
      const updates = {
        ingreso_mensual_deseado: parseFloat(configForm.ingreso_mensual_deseado) || 0,
        margen_freelancer: parseFloat(configForm.margen_freelancer) || 30
      }
      const { error } = await supabase
        .from('configuracion')
        .update(updates)
        .eq('id', 1)
      if (error) throw error
      if (configuracion) {
        setConfiguracion({ ...configuracion, ...updates })
      }
      toast.success('Configuración actualizada')
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveHoras = async () => {
    setLoading(true)
    try {
      for (const s of socios) {
        const horas = parseFloat(horasSocios[s.id]) || 0
        const { error } = await supabase
          .from('workers')
          .update({ horas_disponibles_mes: horas, updated_at: new Date().toISOString() })
          .eq('id', s.id)
        if (error) throw error
      }
      toast.success('Horas de socios actualizadas')
    } catch (error) {
      toast.error('Error al guardar horas')
    } finally {
      setLoading(false)
    }
  }

  const getCostoMensual = (costo: CostoOperativo): number => {
    if (costo.frecuencia === 'mensual') return costo.monto
    if (costo.frecuencia === 'trimestral') return costo.monto / 3
    return costo.monto / 12
  }

  const opcionesFrecuencia = [
    { value: 'mensual', label: 'Mensual' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'anual', label: 'Anual' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Calculadora de Costos" subtitle="Costo operativo mensual y proyección de ingresos" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Columna izquierda: Costos Operativos */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-willou-dark">Costos Operativos</h2>
                <Button onClick={() => handleOpenModal()} className="bg-willou-orange hover:bg-willou-orange/90 text-white">
                  + Nuevo Costo
                </Button>
              </div>
              <CardContent className="p-0">
                {costosOperativos.length === 0 ? (
                  <div className="p-8 text-center text-willou-gray">
                    <p>No hay costos registrados</p>
                    <p className="text-sm mt-1">Agrega internet, luz, suscripciones, etc.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 text-sm font-medium text-willou-gray">Concepto</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-willou-gray">Monto</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-willou-gray">Frecuencia</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-willou-gray">Mensual</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-willou-gray"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {costosOperativos.map((costo) => (
                          <tr key={costo.id} className={`border-b border-gray-100 ${!costo.activo ? 'opacity-50' : ''}`}>
                            <td className="py-3 px-4 text-sm font-medium text-willou-dark">{costo.nombre}</td>
                            <td className="py-3 px-4 text-sm text-right text-willou-dark">{formatCurrency(costo.monto)}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                costo.frecuencia === 'mensual' ? 'bg-green-100 text-green-800' :
                                costo.frecuencia === 'trimestral' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {costo.frecuencia === 'mensual' ? 'Mensual' :
                                 costo.frecuencia === 'trimestral' ? 'Trimestral' : 'Anual'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-medium text-willou-dark">
                              {formatCurrency(getCostoMensual(costo))}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => handleOpenModal(costo)}
                                  className="p-1.5 text-gray-400 hover:text-willou-orange hover:bg-willou-orange/10 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => { setDeletingCosto(costo); setIsConfirmOpen(true) }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuración de socios */}
            {socios.length > 0 && (
              <Card>
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-willou-dark">Horas Disponibles por Socio</h2>
                  <Button onClick={handleSaveHoras} disabled={loading} className="bg-willou-orange hover:bg-willou-orange/90 text-white">
                    {loading ? 'Guardando...' : 'Guardar Horas'}
                  </Button>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {socios.map(s => (
                      <div key={s.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 rounded-xl bg-willou-orange flex items-center justify-center text-white">
                          👤
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-willou-dark">{s.nombre}</p>
                          <p className="text-xs text-willou-gray">{formatCurrency(s.costo_hora)}/h</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="744"
                            value={horasSocios[s.id] || ''}
                            onChange={(e) => setHorasSocios(prev => ({ ...prev, [s.id]: e.target.value }))}
                            className="w-20 px-3 py-2 text-right rounded-lg border border-gray-200 focus:border-willou-orange focus:ring-2 focus:ring-willou-orange/20 outline-none text-sm"
                          />
                          <span className="text-sm text-willou-gray">h/mes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna derecha: Resumen */}
          <div className="space-y-6">
            <Card>
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-willou-dark">Configuración</h2>
                <Button onClick={handleSaveConfig} disabled={loading} variant="outline" size="sm">
                  {loading ? '...' : 'Guardar'}
                </Button>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-willou-dark mb-1">Ingreso mensual deseado</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-willou-gray">$</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={configForm.ingreso_mensual_deseado}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, ingreso_mensual_deseado: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-willou-orange focus:ring-2 focus:ring-willou-orange/20 outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-willou-dark mb-1">Margen freelancer (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={configForm.margen_freelancer}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, margen_freelancer: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-willou-orange focus:ring-2 focus:ring-willou-orange/20 outline-none text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-willou-gray">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-willou-dark mb-4">Resumen Mensual</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-willou-gray">Costo operativo</span>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(resumen.costoMensualTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-willou-gray">Ingreso deseado</span>
                    <span className="text-sm font-medium text-willou-dark">{formatCurrency(resumen.ingresoDeseado)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-willou-dark">Total a generar</span>
                      <span className="font-bold text-willou-orange text-lg">{formatCurrency(resumen.totalGenerar)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-willou-dark mb-4">Horas Necesarias</h2>
                {socios.length === 0 ? (
                  <p className="text-sm text-willou-gray">No hay socios registrados como workers internos</p>
                ) : (
                  <div className="space-y-3">
                    {socios.map(s => {
                      const horas = parseFloat(horasSocios[s.id]) || 0
                      return (
                        <div key={s.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-willou-dark">{s.nombre}</p>
                            <p className="text-xs text-willou-gray">{horas}h disponibles × {formatCurrency(s.costo_hora)}/h</p>
                          </div>
                          <span className="text-sm font-medium text-willou-dark">
                            {formatCurrency(horas * s.costo_hora)}
                          </span>
                        </div>
                      )
                    })}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-willou-gray">Horas totales socios</span>
                        <span className="text-sm font-medium text-willou-dark">{resumen.totalHorasSocios.toFixed(0)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-willou-gray">Costo total horas socios</span>
                        <span className="text-sm font-medium text-willou-dark">{formatCurrency(resumen.costoHorasSocios)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-willou-dark mb-4">Referencia Freelancer</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-willou-gray">Margen</span>
                    <span className="text-sm font-medium text-willou-dark">{resumen.margenFreelancer}%</span>
                  </div>
                  <p className="text-xs text-willou-gray">
                    Costo freelancer × {((100 + resumen.margenFreelancer) / 100).toFixed(2)} = precio al cliente
                  </p>
                  <p className="text-xs text-willou-gray mt-2">
                    Ejemplo: freelancer a $20/h → {formatCurrency(20 * (1 + resumen.margenFreelancer / 100))}/h al cliente
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal crear/editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCosto ? 'Editar Costo' : 'Nuevo Costo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Concepto"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Internet, Luz, Adobe CC..."
          />
          <Input
            label="Monto"
            type="number"
            step="0.01"
            min="0"
            value={formData.monto}
            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
            placeholder="0.00"
          />
          <Select
            label="Frecuencia de pago"
            options={opcionesFrecuencia}
            value={formData.frecuencia}
            onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value as any })}
          />
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-willou-gray">
              Costo mensual: <span className="font-medium text-willou-dark">{formatCurrency(
                formData.frecuencia === 'mensual' ? parseFloat(formData.monto) || 0 :
                formData.frecuencia === 'trimestral' ? (parseFloat(formData.monto) || 0) / 3 :
                (parseFloat(formData.monto) || 0) / 12
              )}</span>
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1 bg-willou-orange hover:bg-willou-orange/90 text-white">
              {editingCosto ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setDeletingCosto(null) }}
        title="Eliminar Costo"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-3xl">🗑️</span>
          </div>
          <p className="text-willou-gray mb-6">
            ¿Eliminar <strong>{deletingCosto?.nombre}</strong>?
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsConfirmOpen(false); setDeletingCosto(null) }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              loading={loading}
              onClick={handleDelete}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
