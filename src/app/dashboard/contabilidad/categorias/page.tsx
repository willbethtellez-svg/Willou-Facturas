'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'
import type { ExpenseCategory } from '@/types'

export default function CategoriasPage() {
  const { expenseCategories, setExpenseCategories } = useAppStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null)
  const [deletingCat, setDeletingCat] = useState<ExpenseCategory | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', tipo: 'operativo' as 'operativo' | 'inversion' | 'otro' })

  const handleOpen = (cat?: ExpenseCategory) => {
    if (cat) {
      setEditingCat(cat)
      setFormData({ nombre: cat.nombre, tipo: cat.tipo })
    } else {
      setEditingCat(null)
      setFormData({ nombre: '', tipo: 'operativo' })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    try {
      if (editingCat) {
        const { error } = await supabase
          .from('expense_categories')
          .update({ nombre: formData.nombre.trim(), tipo: formData.tipo })
          .eq('id', editingCat.id)
        if (error) throw error
        setExpenseCategories(expenseCategories.map(c => c.id === editingCat.id ? { ...c, nombre: formData.nombre.trim(), tipo: formData.tipo } : c))
        toast.success('Categoría actualizada')
      } else {
        const { data, error } = await supabase
          .from('expense_categories')
          .insert([{ nombre: formData.nombre.trim(), tipo: formData.tipo }])
          .select()
          .single()
        if (error) throw error
        setExpenseCategories([...expenseCategories, data])
        toast.success('Categoría creada')
      }
      setIsModalOpen(false)
    } catch { toast.error('Error al guardar') } finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!deletingCat) return
    setLoading(true)
    try {
      await supabase.from('expense_categories').delete().eq('id', deletingCat.id)
      setExpenseCategories(expenseCategories.filter(c => c.id !== deletingCat.id))
      toast.success('Categoría eliminada')
      setIsDeleteOpen(false)
      setDeletingCat(null)
    } catch { toast.error('Error al eliminar') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Categorías de Gastos"
        subtitle="Administra las categorías contables"
        actions={<Button onClick={() => handleOpen()} className="bg-willou-orange hover:bg-willou-orange/90 text-white">+ Nueva Categoría</Button>}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {expenseCategories.length === 0 ? (
          <EmptyState icon="📂" title="No hay categorías" description="Crea categorías para clasificar tus gastos" actionLabel="Crear Categoría" onAction={() => handleOpen()} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenseCategories.map(cat => (
              <Card key={cat.id}>
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-willou-dark">{cat.nombre}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      cat.tipo === 'operativo' ? 'bg-blue-100 text-blue-800' :
                      cat.tipo === 'inversion' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cat.tipo === 'operativo' ? 'Operativo' : cat.tipo === 'inversion' ? 'Inversión' : 'Otro'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpen(cat)} className="p-2 text-gray-400 hover:text-willou-orange rounded-lg" title="Editar">✏️</button>
                    <button onClick={() => { setDeletingCat(cat); setIsDeleteOpen(true) }} className="p-2 text-gray-400 hover:text-red-500 rounded-lg" title="Eliminar">🗑️</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCat ? 'Editar Categoría' : 'Nueva Categoría'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre de la categoría" />
          <div>
            <label className="block text-sm font-medium text-willou-dark mb-2">Tipo</label>
            <div className="flex gap-3">
              {(['operativo', 'inversion', 'otro'] as const).map(t => (
                <label key={t} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer flex-1 transition-colors ${formData.tipo === t ? 'border-willou-orange bg-orange-50' : 'border-gray-200'}`}>
                  <input type="radio" name="tipo" value={t} checked={formData.tipo === t} onChange={() => setFormData({ ...formData, tipo: t })} className="text-willou-orange" />
                  <span className="text-sm font-medium capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={loading} className="flex-1 bg-willou-orange hover:bg-willou-orange/90 text-white">{editingCat ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setDeletingCat(null) }} title="Eliminar Categoría">
        <div className="text-center">
          <p className="text-willou-gray mb-6">¿Eliminar <strong>{deletingCat?.nombre}</strong>? Las entradas contables con esta categoría quedarán sin categoría.</p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { setIsDeleteOpen(false); setDeletingCat(null) }} className="flex-1">Cancelar</Button>
            <Button type="button" loading={loading} onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white">Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
