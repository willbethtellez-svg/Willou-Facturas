'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { supabase, formatCurrency } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import type { Servicio } from '@/types'

export default function ServiciosPage() {
  const { servicios, addServicio, updateServicio, deleteServicio } = useAppStore()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null)
  const [deletingServicio, setDeletingServicio] = useState<Servicio | null>(null)
  const [loading, setLoading] = useState(false)
  const [useHourlyPricing, setUseHourlyPricing] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    horas_estimadas: '',
    costo_hora_agencia: '',
    porcentaje_utilidad: '30'
  })

  const precioSugerido = useMemo(() => {
    const horas = parseFloat(formData.horas_estimadas) || 0
    const costo = parseFloat(formData.costo_hora_agencia) || 0
    const utilidad = parseFloat(formData.porcentaje_utilidad) || 0
    if (horas > 0 && costo > 0) {
      return horas * costo * (1 + utilidad / 100)
    }
    return null
  }, [formData.horas_estimadas, formData.costo_hora_agencia, formData.porcentaje_utilidad])

  const filteredServicios = servicios.filter(s =>
    s.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (s.categoria && s.categoria.toLowerCase().includes(search.toLowerCase())) ||
    (s.descripcion && s.descripcion.toLowerCase().includes(search.toLowerCase()))
  )

  const handleOpenModal = (servicio?: Servicio) => {
    if (servicio) {
      setEditingServicio(servicio)
      const hasHourlyData = servicio.horas_estimadas != null && servicio.costo_hora_agencia != null
      setUseHourlyPricing(hasHourlyData)
      setFormData({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion || '',
        precio: servicio.precio.toString(),
        categoria: servicio.categoria || '',
        horas_estimadas: servicio.horas_estimadas?.toString() || '',
        costo_hora_agencia: servicio.costo_hora_agencia?.toString() || '',
        porcentaje_utilidad: servicio.porcentaje_utilidad?.toString() || '30'
      })
    } else {
      setEditingServicio(null)
      setUseHourlyPricing(false)
      setFormData({ nombre: '', descripcion: '', precio: '', categoria: '', horas_estimadas: '', costo_hora_agencia: '', porcentaje_utilidad: '30' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingServicio(null)
    setFormData({ nombre: '', descripcion: '', precio: '', categoria: '', horas_estimadas: '', costo_hora_agencia: '', porcentaje_utilidad: '30' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!formData.precio || parseFloat(formData.precio) < 0) {
      toast.error('Ingresa un precio válido')
      return
    }
    setLoading(true)

    const servicioData: any = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || null,
      precio: parseFloat(formData.precio),
      categoria: formData.categoria.trim() || null,
    }

    if (useHourlyPricing) {
      servicioData.horas_estimadas = parseFloat(formData.horas_estimadas) || null
      servicioData.costo_hora_agencia = parseFloat(formData.costo_hora_agencia) || null
      servicioData.porcentaje_utilidad = parseFloat(formData.porcentaje_utilidad) || null
      servicioData.precio_sugerido = precioSugerido
    } else {
      servicioData.horas_estimadas = null
      servicioData.costo_hora_agencia = null
      servicioData.porcentaje_utilidad = null
      servicioData.precio_sugerido = null
    }

    try {
      if (editingServicio) {
        const { error } = await supabase
          .from('servicios')
          .update({ ...servicioData, updated_at: new Date().toISOString() })
          .eq('id', editingServicio.id)
        if (error) throw error
        updateServicio({ ...editingServicio, ...servicioData })
        toast.success('Servicio actualizado')
      } else {
        const { data, error } = await supabase
          .from('servicios')
          .insert([servicioData])
          .select()
          .single()
        if (error) throw error
        addServicio(data)
        toast.success('Servicio creado')
      }
      handleCloseModal()
    } catch (error) {
      toast.error('Error al guardar el servicio')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingServicio) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('servicios')
        .delete()
        .eq('id', deletingServicio.id)
      if (error) throw error
      deleteServicio(deletingServicio.id)
      toast.success('Servicio eliminado')
      setIsDeleteModalOpen(false)
      setDeletingServicio(null)
    } catch (error) {
      toast.error('Error al eliminar el servicio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Servicios"
        subtitle="Gestiona tu catálogo de servicios y precios"
        actions={
          <Button onClick={() => handleOpenModal()} className="bg-willou-orange hover:bg-willou-orange/90 text-white">
            + Nuevo Servicio
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <input
            type="text"
            placeholder="Buscar servicios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:outline-none focus:ring-2 focus:ring-willou-orange/20 transition-all"
          />
        </div>

        {filteredServicios.length === 0 ? (
          <EmptyState
            icon="📦"
            title={search ? 'No se encontraron servicios' : 'No hay servicios registrados'}
            description={search ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer servicio al catálogo'}
            actionLabel={search ? undefined : 'Crear Servicio'}
            onAction={search ? undefined : () => handleOpenModal()}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServicios.map((servicio) => (
              <Card key={servicio.id} className="rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 card-hover">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-willou-dark flex items-center justify-center text-white">
                      <span className="text-xl">🔧</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(servicio)}
                        className="p-2 text-gray-400 hover:text-willou-orange hover:bg-willou-orange/10 rounded-lg transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          setDeletingServicio(servicio)
                          setIsDeleteModalOpen(true)
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-willou-dark mb-1">{servicio.nombre}</h3>
                  {servicio.descripcion && (
                    <p className="text-willou-gray text-sm mb-3 line-clamp-2">{servicio.descripcion}</p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-2xl font-bold text-willou-orange">{formatCurrency(servicio.precio)}</span>
                    {servicio.categoria && (
                      <span className="px-3 py-1 bg-willou-purple/20 text-willou-dark text-xs font-medium rounded-full">
                        {servicio.categoria}
                      </span>
                    )}
                  </div>

                  {servicio.horas_estimadas && (
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-willou-gray">Horas est.</span>
                        <p className="font-medium text-willou-dark">{servicio.horas_estimadas}h</p>
                      </div>
                      <div>
                        <span className="text-willou-gray">$/hora agencia</span>
                        <p className="font-medium text-willou-dark">{formatCurrency(servicio.costo_hora_agencia || 0)}</p>
                      </div>
                      <div>
                        <span className="text-willou-gray">Utilidad</span>
                        <p className="font-medium text-willou-dark">{servicio.porcentaje_utilidad || 30}%</p>
                      </div>
                      <div>
                        <span className="text-willou-gray">Sugerido</span>
                        <p className="font-medium text-willou-orange">{formatCurrency(servicio.precio_sugerido || 0)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Nombre del servicio"
          />
          <Input
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción del servicio"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useHourlyPricing}
                onChange={(e) => setUseHourlyPricing(e.target.checked)}
                className="rounded text-willou-orange focus:ring-willou-orange"
              />
              <span className="text-sm font-medium text-willou-dark">Usar pricing por horas</span>
            </label>
          </div>
          {useHourlyPricing ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Horas estimadas"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.horas_estimadas}
                  onChange={(e) => setFormData({ ...formData, horas_estimadas: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="$ / hora agencia"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costo_hora_agencia}
                  onChange={(e) => setFormData({ ...formData, costo_hora_agencia: e.target.value })}
                  placeholder="0.00"
                />
                <Input
                  label="% Utilidad"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.porcentaje_utilidad}
                  onChange={(e) => setFormData({ ...formData, porcentaje_utilidad: e.target.value })}
                  placeholder="30"
                />
              </div>
              {precioSugerido !== null && (
                <div className="p-3 rounded-lg bg-willou-purple/20">
                  <p className="text-sm text-willou-gray">Precio sugerido</p>
                  <p className="text-lg font-bold text-willou-orange">{formatCurrency(precioSugerido)}</p>
                  <p className="text-xs text-willou-gray mt-1">
                    {formData.horas_estimadas}h × {formatCurrency(parseFloat(formData.costo_hora_agencia) || 0)} × {1 + (parseFloat(formData.porcentaje_utilidad) || 0) / 100}% utilidad
                  </p>
                </div>
              )}
              <Input
                label="Precio final (puedes sobreescribir)"
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                placeholder={precioSugerido ? precioSugerido.toFixed(2) : "0.00"}
              />
            </>
          ) : (
            <Input
              label="Precio"
              type="number"
              step="0.01"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              placeholder="0.00"
            />
          )}
          <Input
            label="Categoría"
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            placeholder="Categoría del servicio"
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1 bg-willou-orange hover:bg-willou-orange/90 text-white">
              {editingServicio ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeletingServicio(null) }}
        title="Eliminar Servicio"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-willou-gray mb-6">
            ¿Estás seguro de que deseas eliminar <strong className="text-willou-dark">{deletingServicio?.nombre}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setDeletingServicio(null) }} className="flex-1">Cancelar</Button>
            <Button type="button" loading={loading} onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white">Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
