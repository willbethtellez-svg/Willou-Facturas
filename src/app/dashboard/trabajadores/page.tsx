'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { supabase, formatCurrency } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import type { Worker } from '@/types'

export default function TrabajadoresPage() {
  const { workers, addWorker, updateWorker, deleteWorker } = useAppStore()
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [confirmingWorker, setConfirmingWorker] = useState<Worker | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'freelancer' as 'interno' | 'freelancer',
    costo_hora: '',
    telefono: '',
    correo: '',
    notas: ''
  })

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (w.correo && w.correo.toLowerCase().includes(search.toLowerCase()))
    const matchesTipo = filterTipo === 'todos' || w.tipo === filterTipo
    return matchesSearch && matchesTipo
  })

  const handleOpenModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker)
      setFormData({
        nombre: worker.nombre,
        tipo: worker.tipo,
        costo_hora: worker.costo_hora.toString(),
        telefono: worker.telefono || '',
        correo: worker.correo || '',
        notas: worker.notas || ''
      })
    } else {
      setEditingWorker(null)
      setFormData({
        nombre: '',
        tipo: 'freelancer',
        costo_hora: '',
        telefono: '',
        correo: '',
        notas: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingWorker(null)
    setFormData({ nombre: '', tipo: 'freelancer', costo_hora: '', telefono: '', correo: '', notas: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setLoading(true)

    const workerData = {
      nombre: formData.nombre.trim(),
      tipo: formData.tipo,
      costo_hora: parseFloat(formData.costo_hora) || 0,
      telefono: formData.telefono.trim() || null,
      correo: formData.correo.trim() || null,
      notas: formData.notas.trim() || null
    }

    try {
      if (editingWorker) {
        const { error } = await supabase
          .from('workers')
          .update({ ...workerData, updated_at: new Date().toISOString() })
          .eq('id', editingWorker.id)
        if (error) throw error
        updateWorker({ ...editingWorker, ...workerData })
        toast.success('Trabajador actualizado')
      } else {
        const { data, error } = await supabase
          .from('workers')
          .insert([workerData])
          .select()
          .single()
        if (error) throw error
        addWorker(data)
        toast.success('Trabajador creado')
      }
      handleCloseModal()
    } catch (error) {
      toast.error('Error al guardar el trabajador')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActivo = async (worker: Worker) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('workers')
        .update({ activo: !worker.activo, updated_at: new Date().toISOString() })
        .eq('id', worker.id)
      if (error) throw error
      updateWorker({ ...worker, activo: !worker.activo })
      toast.success(worker.activo ? 'Trabajador desactivado' : 'Trabajador activado')
    } catch (error) {
      toast.error('Error al cambiar estado')
    } finally {
      setLoading(false)
      setIsConfirmOpen(false)
      setConfirmingWorker(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Trabajadores"
        subtitle="Gestiona empleados internos y freelancers"
        actions={
          <Button onClick={() => handleOpenModal()} className="bg-willou-orange hover:bg-willou-orange/90 text-white">
            + Nuevo Trabajador
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex gap-4">
          <input
            type="text"
            placeholder="Buscar trabajadores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:outline-none focus:ring-2 focus:ring-willou-orange/20 transition-all"
          />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:outline-none focus:ring-2 focus:ring-willou-orange/20 transition-all bg-white"
          >
            <option value="todos">Todos</option>
            <option value="interno">Internos</option>
            <option value="freelancer">Freelancers</option>
          </select>
        </div>

        {filteredWorkers.length === 0 ? (
          <EmptyState
            icon="👥"
            title={search ? 'No se encontraron trabajadores' : 'No hay trabajadores registrados'}
            description={search ? 'Intenta con otros términos de búsqueda' : 'Agrega empleados internos y freelancers'}
            actionLabel={search ? undefined : 'Crear Trabajador'}
            onAction={search ? undefined : () => handleOpenModal()}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker) => (
              <Card key={worker.id} className={`rounded-2xl overflow-hidden transition-all duration-300 card-hover ${!worker.activo ? 'opacity-60' : ''}`}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${worker.tipo === 'interno' ? 'bg-willou-orange' : 'bg-willou-purple'}`}>
                      <span className="text-xl">{worker.tipo === 'interno' ? '👤' : '🆓'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(worker)}
                        className="p-2 text-gray-400 hover:text-willou-orange hover:bg-willou-orange/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          setConfirmingWorker(worker)
                          setIsConfirmOpen(true)
                        }}
                        className={`p-2 rounded-lg transition-colors ${worker.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={worker.activo ? 'Desactivar' : 'Activar'}
                      >
                        {worker.activo ? '⛔' : '✅'}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-willou-dark mb-1">{worker.nombre}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${worker.tipo === 'interno' ? 'bg-willou-orange/20 text-orange-800' : 'bg-willou-purple/40 text-willou-dark'}`}>
                    {worker.tipo === 'interno' ? 'Interno' : 'Freelancer'}
                  </span>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-willou-gray">Costo por hora</span>
                      <span className="font-medium text-willou-dark">{formatCurrency(worker.costo_hora)}</span>
                    </div>
                    {worker.telefono && (
                      <div className="flex justify-between">
                        <span className="text-willou-gray">Teléfono</span>
                        <span className="text-willou-dark">{worker.telefono}</span>
                      </div>
                    )}
                    {worker.correo && (
                      <div className="flex justify-between">
                        <span className="text-willou-gray">Correo</span>
                        <span className="text-willou-dark truncate max-w-[180px]">{worker.correo}</span>
                      </div>
                    )}
                  </div>

                  {worker.notas && (
                    <p className="text-xs text-willou-gray mt-3 pt-3 border-t border-gray-100">{worker.notas}</p>
                  )}

                  {!worker.activo && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-red-500 font-medium">Inactivo</span>
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
        title={editingWorker ? 'Editar Trabajador' : 'Nuevo Trabajador'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Nombre del trabajador"
          />
          <div>
            <label className="block text-sm font-medium text-willou-dark mb-2">Tipo</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer flex-1 transition-colors" style={{ borderColor: formData.tipo === 'interno' ? '#fb5a2e' : '#e5e5e5' }}>
                <input
                  type="radio"
                  name="tipo"
                  value="interno"
                  checked={formData.tipo === 'interno'}
                  onChange={() => setFormData({ ...formData, tipo: 'interno' })}
                  className="text-willou-orange focus:ring-willou-orange"
                />
                <div>
                  <p className="font-medium text-sm text-willou-dark">Interno</p>
                  <p className="text-xs text-willou-gray">Empleado fijo</p>
                </div>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer flex-1 transition-colors" style={{ borderColor: formData.tipo === 'freelancer' ? '#fb5a2e' : '#e5e5e5' }}>
                <input
                  type="radio"
                  name="tipo"
                  value="freelancer"
                  checked={formData.tipo === 'freelancer'}
                  onChange={() => setFormData({ ...formData, tipo: 'freelancer' })}
                  className="text-willou-orange focus:ring-willou-orange"
                />
                <div>
                  <p className="font-medium text-sm text-willou-dark">Freelancer</p>
                  <p className="text-xs text-willou-gray">Contratista externo</p>
                </div>
              </label>
            </div>
          </div>
          <Input
            label="Costo por hora ($)"
            type="number"
            step="0.01"
            min="0"
            value={formData.costo_hora}
            onChange={(e) => setFormData({ ...formData, costo_hora: e.target.value })}
            placeholder="0.00"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
            <Input
              label="Correo"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-willou-dark mb-2">Notas</label>
            <textarea
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none"
              rows={3}
              placeholder="Notas adicionales..."
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1 bg-willou-orange hover:bg-willou-orange/90 text-white">
              {editingWorker ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setConfirmingWorker(null) }}
        title={confirmingWorker?.activo ? 'Desactivar Trabajador' : 'Activar Trabajador'}
      >
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${confirmingWorker?.activo ? 'bg-red-100' : 'bg-green-100'}`}>
            <span className="text-3xl">{confirmingWorker?.activo ? '⛔' : '✅'}</span>
          </div>
          <p className="text-willou-gray mb-6">
            {confirmingWorker?.activo
              ? `¿Desactivar a ${confirmingWorker?.nombre}? No podrá asignarse a nuevas facturas.`
              : `¿Activar a ${confirmingWorker?.nombre}? Podrá asignarse a facturas nuevamente.`}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsConfirmOpen(false); setConfirmingWorker(null) }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              loading={loading}
              onClick={() => confirmingWorker && handleToggleActivo(confirmingWorker)}
              className={`flex-1 text-white ${confirmingWorker?.activo ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {confirmingWorker?.activo ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
