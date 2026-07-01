'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { supabase, formatCurrency, formatDate } from '@/lib/supabase'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'
import type { AccountingEntry } from '@/types'

export default function ContabilidadPage() {
  const { accountingEntries, expenseCategories, facturas, addAccountingEntry, updateAccountingEntry, deleteAccountingEntry } = useAppStore()
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [filterMes, setFilterMes] = useState(() => new Date().toISOString().slice(0, 7))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<AccountingEntry | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<AccountingEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [tipoEntry, setTipoEntry] = useState<'ingreso' | 'egreso'>('ingreso')
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    banco_fee: '',
    categoria_id: '',
    factura_id: '',
    descripcion: ''
  })

  const filteredEntries = accountingEntries.filter(e => {
    const matchesTipo = filterTipo === 'todos' || e.tipo === filterTipo
    const matchesMes = !filterMes || e.fecha?.startsWith(filterMes)
    return matchesTipo && matchesMes
  })

  const totalIngresos = filteredEntries.filter(e => e.tipo === 'ingreso').reduce((s, e) => s + e.monto, 0)
  const totalEgresos = filteredEntries.filter(e => e.tipo === 'egreso').reduce((s, e) => s + e.monto, 0)
  const totalComisiones = filteredEntries.reduce((s, e) => s + (e.banco_fee || 0), 0)
  const balance = totalIngresos - totalEgresos - totalComisiones

  const handleOpenModal = (entry?: AccountingEntry) => {
    if (entry) {
      setEditingEntry(entry)
      setTipoEntry(entry.tipo)
      setFormData({
        fecha: entry.fecha,
        monto: entry.monto.toString(),
        banco_fee: (entry.banco_fee || 0).toString(),
        categoria_id: entry.categoria_id || '',
        factura_id: entry.factura_id || '',
        descripcion: entry.descripcion || ''
      })
    } else {
      setEditingEntry(null)
      setTipoEntry('ingreso')
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        monto: '',
        banco_fee: '',
        categoria_id: '',
        factura_id: '',
        descripcion: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    setLoading(true)

    const entryData = {
      fecha: formData.fecha,
      tipo: tipoEntry,
      monto: parseFloat(formData.monto),
      banco_fee: parseFloat(formData.banco_fee) || 0,
      categoria_id: formData.categoria_id || null,
      factura_id: formData.factura_id || null,
      descripcion: formData.descripcion.trim() || null
    }

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('accounting_entries')
          .update({ ...entryData, updated_at: new Date().toISOString() })
          .eq('id', editingEntry.id)
        if (error) throw error
        updateAccountingEntry({ ...editingEntry, ...entryData })
        toast.success('Entrada actualizada')
      } else {
        const { data, error } = await supabase
          .from('accounting_entries')
          .insert([entryData])
          .select()
          .single()
        if (error) throw error
        addAccountingEntry(data)
        toast.success('Entrada registrada')
      }
      setIsModalOpen(false)
    } catch (error) {
      toast.error('Error al guardar la entrada')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingEntry) return
    setLoading(true)
    try {
      await supabase.from('accounting_entries').delete().eq('id', deletingEntry.id)
      deleteAccountingEntry(deletingEntry.id)
      toast.success('Entrada eliminada')
      setIsDeleteModalOpen(false)
      setDeletingEntry(null)
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setLoading(false)
    }
  }

  const getCategoriaNombre = (catId: string | null) => {
    if (!catId) return '-'
    const cat = expenseCategories.find(c => c.id === catId)
    return cat?.nombre || '-'
  }

  const getFacturaNumero = (facId: string | null) => {
    if (!facId) return '-'
    const fac = facturas.find(f => f.id === facId)
    return fac ? `#${fac.numero}` : '-'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Contabilidad"
        subtitle="Libro de ingresos y egresos"
        actions={
          <div className="flex gap-3">
            <Link href="/dashboard/contabilidad/categorias">
              <Button variant="outline">
                Gestionar Categorías
              </Button>
            </Link>
            <Button onClick={() => handleOpenModal()} className="bg-willou-orange hover:bg-willou-orange/90 text-white">
              + Nueva Entrada
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Ingresos</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalIngresos)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Egresos</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalEgresos)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Comisiones</p>
              <p className="text-xl font-bold text-willou-gray">{formatCurrency(totalComisiones)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-willou-gray">Balance Neto</p>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-6">
          <input
            type="month"
            value={filterMes}
            onChange={(e) => setFilterMes(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:outline-none focus:ring-2 focus:ring-willou-orange/20"
          />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:outline-none focus:ring-2 focus:ring-willou-orange/20 transition-all bg-white"
          >
            <option value="todos">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
          </select>
        </div>

        {filteredEntries.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No hay entradas contables"
            description="Registra ingresos y egresos para llevar el control financiero"
            actionLabel="Nueva Entrada"
            onAction={() => handleOpenModal()}
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-willou-gray">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-willou-gray">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-willou-gray">Categoría</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-willou-gray">Factura</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-willou-gray">Descripción</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-willou-gray">Monto</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-willou-gray">Comisión</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-willou-gray"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-willou-dark">{formatDate(entry.fecha)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {entry.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-willou-gray">{getCategoriaNombre(entry.categoria_id)}</td>
                      <td className="py-3 px-4 text-sm text-willou-gray">{getFacturaNumero(entry.factura_id)}</td>
                      <td className="py-3 px-4 text-sm text-willou-dark max-w-[200px] truncate">{entry.descripcion || '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-right">{formatCurrency(entry.monto)}</td>
                      <td className="py-3 px-4 text-sm text-right text-willou-gray">{entry.banco_fee ? formatCurrency(entry.banco_fee) : '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleOpenModal(entry)} className="p-1.5 text-gray-400 hover:text-willou-orange rounded" title="Editar">✏️</button>
                          <button onClick={() => { setDeletingEntry(entry); setIsDeleteModalOpen(true) }} className="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Eliminar">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Editar Entrada' : 'Nueva Entrada Contable'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-willou-dark mb-2">Tipo</label>
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer flex-1 transition-colors ${tipoEntry === 'ingreso' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <input type="radio" name="tipo" value="ingreso" checked={tipoEntry === 'ingreso'} onChange={() => setTipoEntry('ingreso')} className="text-green-500" />
                <span className="text-sm font-medium">Ingreso</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer flex-1 transition-colors ${tipoEntry === 'egreso' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                <input type="radio" name="tipo" value="egreso" checked={tipoEntry === 'egreso'} onChange={() => setTipoEntry('egreso')} className="text-red-500" />
                <span className="text-sm font-medium">Egreso</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha" type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} />
            <Input label="Monto ($)" type="number" step="0.01" min="0" value={formData.monto} onChange={(e) => setFormData({ ...formData, monto: e.target.value })} placeholder="0.00" />
          </div>
          {tipoEntry === 'ingreso' && (
            <Input label="Comisión bancaria ($)" type="number" step="0.01" min="0" value={formData.banco_fee} onChange={(e) => setFormData({ ...formData, banco_fee: e.target.value })} placeholder="0.00" />
          )}
          <div>
            <label className="block text-sm font-medium text-willou-dark mb-2">Categoría</label>
            <select
              value={formData.categoria_id}
              onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:ring-2 focus:ring-orange-200 outline-none bg-white"
            >
              <option value="">Sin categoría</option>
              {expenseCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre} ({cat.tipo})</option>
              ))}
            </select>
          </div>
          {tipoEntry === 'ingreso' && (
            <div>
              <label className="block text-sm font-medium text-willou-dark mb-2">Vinculado a factura</label>
              <select
                value={formData.factura_id}
                onChange={(e) => setFormData({ ...formData, factura_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:ring-2 focus:ring-orange-200 outline-none bg-white"
              >
                <option value="">Sin factura</option>
                {facturas.map(f => (
                  <option key={f.id} value={f.id}>#{f.numero} - {f.cliente?.nombre || 'Sin cliente'} - {formatCurrency(f.total)}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-willou-dark mb-2">Descripción</label>
            <textarea
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none"
              rows={2}
              placeholder="Descripción de la entrada..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={loading} className="flex-1 bg-willou-orange hover:bg-willou-orange/90 text-white">
              {editingEntry ? 'Actualizar' : 'Registrar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeletingEntry(null) }} title="Eliminar Entrada">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-willou-gray mb-6">¿Eliminar esta entrada contable? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setDeletingEntry(null) }} className="flex-1">Cancelar</Button>
            <Button type="button" loading={loading} onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white">Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
