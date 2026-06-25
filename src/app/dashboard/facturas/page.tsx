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
import FacturaPDF from '@/components/factura/FacturaPDF'
import { pdf } from '@react-pdf/renderer'
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
  const { facturas, configuracion, updateFactura } = useAppStore()
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedFactura, setSelectedFactura] = useState<any>(null)
  const [paymentType, setPaymentType] = useState<'completo' | 'abono'>('completo')
  const [abonoAmount, setAbonoAmount] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [facturaToDelete, setFacturaToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

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

  const openPaymentModal = (factura: any) => {
    setSelectedFactura(factura)
    setPaymentType('completo')
    setAbonoAmount('')
    setPaymentModalOpen(true)
  }

  const handlePayment = async () => {
    if (!selectedFactura) return

    setProcessingPayment(true)
    try {
      let newEstado = selectedFactura.estado
      let newMontoAbonado = selectedFactura.monto_abonado || 0
      let newSaldoPendiente = selectedFactura.saldo_pendiente || selectedFactura.total

      if (paymentType === 'completo') {
        newEstado = 'pagada'
        newMontoAbonado = selectedFactura.total
        newSaldoPendiente = 0
      } else {
        const abono = parseFloat(abonoAmount) || 0
        if (abono <= 0) {
          toast.error('Ingresa un monto válido')
          setProcessingPayment(false)
          return
        }
        newMontoAbonado = (selectedFactura.monto_abonado || 0) + abono
        newSaldoPendiente = selectedFactura.total - newMontoAbonado

        if (newMontoAbonado >= selectedFactura.total) {
          newEstado = 'pagada'
          newSaldoPendiente = 0
        }
      }

      const { error } = await supabase
        .from('facturas')
        .update({
          estado: newEstado,
          monto_abonado: newMontoAbonado,
          saldo_pendiente: newSaldoPendiente,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedFactura.id)

      if (error) throw error

      updateFactura({
        ...selectedFactura,
        estado: newEstado,
        monto_abonado: newMontoAbonado,
        saldo_pendiente: newSaldoPendiente,
      })

      toast.success(
        paymentType === 'completo'
          ? `Factura ${selectedFactura.numero} marcada como pagada`
          : `Abono de ${formatCurrency(parseFloat(abonoAmount))} registrado`
      )
      setPaymentModalOpen(false)
      setSelectedFactura(null)
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el pago')
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleDownloadPDF = async (factura: any) => {
    setLoadingId(factura.id)
    try {
      const { data: facturaData } = await supabase
        .from('facturas')
        .select(`
          *,
          clientes (*),
          factura_items (*, servicios (*))
        `)
        .eq('id', factura.id)
        .single()

      if (!facturaData) throw new Error('Factura no encontrada')

      const cliente = facturaData.clientes
      const items = (facturaData.factura_items || []).map((item: any) => ({
        ...item,
        servicio: item.servicios || null,
      }))

      const blob = await pdf(
        <FacturaPDF
          factura={facturaData}
          cliente={cliente}
          items={items}
          configuracion={configuracion || {
            nombre_empresa: 'willou',
            direccion_empresa: '',
            telefono_empresa: '',
            correo_empresa: ''
          }}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${factura.numero}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF descargado correctamente')
    } catch (err: any) {
      console.error('Error downloading PDF:', err)
      toast.error('Error al descargar el PDF')
    } finally {
      setLoadingId(null)
    }
  }

  const openDeleteModal = (factura: any) => {
    setFacturaToDelete(factura)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!facturaToDelete) return

    setDeleting(true)
    try {
      // First delete items
      const { error: itemsError } = await supabase
        .from('factura_items')
        .delete()
        .eq('factura_id', facturaToDelete.id)

      if (itemsError) throw itemsError

      // Then delete factura
      const { error: facturaError } = await supabase
        .from('facturas')
        .delete()
        .eq('id', facturaToDelete.id)

      if (facturaError) throw facturaError

      // Update local store
      useAppStore.setState((state) => ({
        facturas: state.facturas.filter((f) => f.id !== facturaToDelete.id)
      }))

      toast.success(`Factura ${facturaToDelete.numero} eliminada`)
      setDeleteModalOpen(false)
      setFacturaToDelete(null)
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar la factura')
    } finally {
      setDeleting(false)
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
                      <th className="pb-3 text-center">Acciones</th>
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
                        <td className="py-4 pr-4 font-medium" style={{ color: '#232323' }}>
                          {factura.numero}
                        </td>
                        <td className="py-4 pr-4">
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
                        <td className="py-4 pr-4" style={{ color: '#4c4c4c' }}>
                          {formatDate(factura.fecha_emision)}
                        </td>
                        <td className="py-4 pr-4">
                          <Badge variant={estadoVariant[factura.estado]}>
                            {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
                          </Badge>
                          {factura.estado === 'pendiente' && factura.monto_abonado > 0 && (
                            <span className="block text-xs mt-1" style={{ color: '#fb5a2e' }}>
                              Abonado: {formatCurrency(factura.monto_abonado)}
                            </span>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-right font-semibold" style={{ color: '#232323' }}>
                          {formatCurrency(factura.total)}
                          {factura.estado === 'pendiente' && factura.saldo_pendiente > 0 && factura.saldo_pendiente !== factura.total && (
                            <span className="block text-xs font-normal" style={{ color: '#fb5a2e' }}>
                              Saldo: {formatCurrency(factura.saldo_pendiente)}
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Ver */}
                            <Link
                              href={`/dashboard/facturas/${factura.id}`}
                              className="relative group"
                            >
                              <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:border-willou-orange hover:bg-willou-orange/5 transition-all">
                                <svg className="w-4 h-4" style={{ color: '#4c4c4c' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </div>
                              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Ver
                              </span>
                            </Link>

                            {/* Pagar/Abonar */}
                            {factura.estado !== 'pagada' && factura.estado !== 'cancelada' && (
                              <button
                                onClick={() => openPaymentModal(factura)}
                                className="relative group"
                              >
                                <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:border-green-500 hover:bg-green-50 transition-all">
                                  <svg className="w-4 h-4" style={{ color: '#4c4c4c' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  Pagar
                                </span>
                              </button>
                            )}

                            {/* Pagada - estado visual */}
                            {factura.estado === 'pagada' && (
                              <div className="relative group">
                                <div className="w-9 h-9 rounded-lg border border-green-200 bg-green-50 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  Pagada
                                </span>
                              </div>
                            )}

                            {/* PDF */}
                            <button
                              onClick={() => handleDownloadPDF(factura)}
                              disabled={loadingId === factura.id}
                              className="relative group"
                            >
                              <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:border-willou-orange hover:bg-willou-orange/5 transition-all">
                                {loadingId === factura.id ? (
                                  <div className="w-4 h-4 border-2 border-willou-orange border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-4 h-4" style={{ color: '#4c4c4c' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                              </div>
                              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                PDF
                              </span>
                            </button>

                            {/* Eliminar */}
                            <button
                              onClick={() => openDeleteModal(factura)}
                              className="relative group"
                            >
                              <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:border-red-500 hover:bg-red-50 transition-all">
                                <svg className="w-4 h-4" style={{ color: '#4c4c4c' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </div>
                              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Eliminar
                              </span>
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
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Pago - Factura ${selectedFactura?.numero || ''}`}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#f5f5f5' }}>
            <p className="text-sm" style={{ color: '#4c4c4c' }}>Total de la factura</p>
            <p className="text-xl font-bold" style={{ color: '#232323' }}>
              {selectedFactura ? formatCurrency(selectedFactura.total) : '$0.00'}
            </p>
            {selectedFactura?.monto_abonado > 0 && (
              <p className="text-sm mt-1" style={{ color: '#fb5a2e' }}>
                Ya abonado: {formatCurrency(selectedFactura.monto_abonado)}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors" style={{ borderColor: paymentType === 'completo' ? '#fb5a2e' : '#e5e5e5' }}>
              <input
                type="radio"
                name="paymentType"
                checked={paymentType === 'completo'}
                onChange={() => setPaymentType('completo')}
                className="text-willou-orange focus:ring-willou-orange"
              />
              <div>
                <p className="font-medium" style={{ color: '#232323' }}>Pago completo</p>
                <p className="text-sm" style={{ color: '#4c4c4c' }}>Marcar factura como pagada</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors" style={{ borderColor: paymentType === 'abono' ? '#fb5a2e' : '#e5e5e5' }}>
              <input
                type="radio"
                name="paymentType"
                checked={paymentType === 'abono'}
                onChange={() => setPaymentType('abono')}
                className="text-willou-orange focus:ring-willou-orange"
              />
              <div>
                <p className="font-medium" style={{ color: '#232323' }}>Abono parcial</p>
                <p className="text-sm" style={{ color: '#4c4c4c' }}>Registrar un abono parcial</p>
              </div>
            </label>
          </div>

          {paymentType === 'abono' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#4c4c4c' }}>
                Monto del abono
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={selectedFactura ? selectedFactura.total - (selectedFactura.monto_abonado || 0) : 0}
                value={abonoAmount}
                onChange={(e) => setAbonoAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-willou-orange"
                style={{ borderColor: '#d7bdff' }}
              />
              {abonoAmount && parseFloat(abonoAmount) > 0 && selectedFactura && (
                <p className="text-sm mt-1" style={{ color: '#4c4c4c' }}>
                  Saldo después del abono: {formatCurrency(
                    selectedFactura.total - (selectedFactura.monto_abonado || 0) - parseFloat(abonoAmount)
                  )}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="flex-1 px-4 py-2 border rounded-lg font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: '#d7bdff', color: '#4c4c4c' }}
            >
              Cancelar
            </button>
            <button
              onClick={handlePayment}
              disabled={processingPayment || (paymentType === 'abono' && (!abonoAmount || parseFloat(abonoAmount) <= 0))}
              className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#fb5a2e' }}
            >
              {processingPayment ? 'Procesando...' : paymentType === 'completo' ? 'Marcar Pagada' : 'Registrar Abono'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Factura"
      >
        <div className="space-y-4">
          <p style={{ color: '#4c4c4c' }}>
            ¿Estás seguro de que deseas eliminar la factura <strong>{facturaToDelete?.numero}</strong>?
          </p>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            Esta acción no se puede deshacer. Se eliminarán todos los items asociados.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="flex-1 px-4 py-2 border rounded-lg font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: '#d7bdff', color: '#4c4c4c' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 bg-red-500 hover:bg-red-600"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
