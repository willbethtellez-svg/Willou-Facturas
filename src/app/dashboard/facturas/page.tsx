'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { supabase, formatCurrency, formatDate } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'
import Link from 'next/link'

type FilterTab = 'todas' | 'pendiente' | 'pagada' | 'cancelada'

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Pendientes', value: 'pendiente' },
  { label: 'Pagadas', value: 'pagada' },
  { label: 'Canceladas', value: 'cancelada' },
]

const estadoVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  pagada: 'success',
  pendiente: 'warning',
  cancelada: 'danger',
}

export default function FacturasPage() {
  const { facturas, updateFactura } = useAppStore()
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filteredFacturas = useMemo(() => {
    let result = [...facturas]

    if (activeFilter !== 'todas') {
      result = result.filter((f) => f.estado === activeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (f) =>
          f.numero.toLowerCase().includes(q) ||
          f.cliente?.nombre?.toLowerCase().includes(q) ||
          f.cliente?.empresa?.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime())

    return result
  }, [facturas, activeFilter, searchQuery])

  const handleMarcarPagada = async (factura: typeof facturas[0]) => {
    setLoadingId(factura.id)
    try {
      const { error } = await supabase
        .from('facturas')
        .update({ estado: 'pagada', updated_at: new Date().toISOString() })
        .eq('id', factura.id)

      if (error) throw error

      updateFactura({ ...factura, estado: 'pagada' })
      toast.success(`Factura ${factura.numero} marcada como pagada`)
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la factura')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9f9f9' }}>
      <Header
        title="Facturas"
        subtitle="Gestiona todas tus facturas"
        actions={
          <Link href="/dashboard/facturas/nueva">
            <Button variant="primary">Nueva Factura</Button>
          </Link>
        }
      />

      <div className="px-6 pb-8">
        <Card>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex gap-2 flex-wrap">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveFilter(tab.value)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: activeFilter === tab.value ? '#fb5a2e' : '#f0f0f0',
                      color: activeFilter === tab.value ? '#fff' : '#4c4c4c',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Buscar por número o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#d7bdff' }}
              />
            </div>

            {filteredFacturas.length === 0 ? (
              <EmptyState
                icon="📄"
                title="No hay facturas"
                description={
                  searchQuery
                    ? 'No se encontraron facturas con ese criterio de búsqueda.'
                    : 'Aún no has creado ninguna factura.'
                }
                actionLabel={!searchQuery ? 'Crear Factura' : undefined}
                onAction={
                  !searchQuery
                    ? () => (window.location.href = '/dashboard/facturas/nueva')
                    : undefined
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#4c4c4c' }}
                    >
                      <th className="pb-3 pr-4">N°</th>
                      <th className="pb-3 pr-4">Cliente</th>
                      <th className="pb-3 pr-4">Fecha</th>
                      <th className="pb-3 pr-4">Estado</th>
                      <th className="pb-3 pr-4 text-right">Total</th>
                      <th className="pb-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFacturas.map((factura, index) => (
                      <tr
                        key={factura.id}
                        className="border-t transition-colors"
                        style={{
                          backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
                          borderColor: '#eee',
                        }}
                      >
                        <td className="py-3 pr-4 font-medium" style={{ color: '#232323' }}>
                          {factura.numero}
                        </td>
                        <td className="py-3 pr-4">
                          <div>
                            <span style={{ color: '#232323' }}>
                              {factura.cliente?.nombre || 'Sin cliente'}
                            </span>
                            {factura.cliente?.empresa && (
                              <span className="block text-xs" style={{ color: '#4c4c4c' }}>
                                {factura.cliente.empresa}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4" style={{ color: '#4c4c4c' }}>
                          {formatDate(factura.fecha_emision)}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={estadoVariant[factura.estado]}>
                            {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold" style={{ color: '#232323' }}>
                          {formatCurrency(factura.total)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/facturas/${factura.id}`}>
                              <Button variant="ghost">Ver</Button>
                            </Link>
                            {factura.estado !== 'pagada' && (
                              <Button
                                variant="secondary"
                                loading={loadingId === factura.id}
                                onClick={() => handleMarcarPagada(factura)}
                              >
                                Marcar Pagada
                              </Button>
                            )}
                            <Link href={`/dashboard/facturas/${factura.id}/pdf`}>
                              <Button variant="ghost">PDF</Button>
                            </Link>
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
      </div>
    </div>
  )
}
