'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { supabase, formatCurrency, formatDate } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import FacturaPDF from '@/components/factura/FacturaPDF'
import { PDFDownloadLink, PDFViewer, pdf } from '@react-pdf/renderer'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function FacturaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { facturas, configuracion, updateFactura } = useAppStore()

  const [factura, setFactura] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingPaid, setMarkingPaid] = useState(false)

  const facturaId = params.id

  useEffect(() => {
    fetchFactura()
  }, [facturaId])

  async function fetchFactura() {
    try {
      setLoading(true)
      setError(null)

      const { data: facturaData, error: facturaError } = await supabase
        .from('facturas')
        .select(`
          *,
          clientes (*),
          factura_items (*)
        `)
        .eq('id', facturaId)
        .single()

      if (facturaError) throw facturaError
      if (!facturaData) {
        setError('Factura no encontrada')
        return
      }

      setFactura(facturaData)
      setCliente(facturaData.clientes)
      setItems(facturaData.factura_items || [])
    } catch (err) {
      console.error('Error fetching factura:', err)
      setError('Error al cargar la factura')
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAsPaid() {
    if (!factura) return

    try {
      setMarkingPaid(true)

      const { error } = await supabase
        .from('facturas')
        .update({ estado: 'pagada', updated_at: new Date().toISOString() })
        .eq('id', factura.id)

      if (error) throw error

      updateFactura({ ...factura, estado: 'pagada' })
      setFactura({ ...factura, estado: 'pagada' })
      toast.success('Factura marcada como pagada')
    } catch (err) {
      console.error('Error marking as paid:', err)
      toast.error('Error al marcar como pagada')
    } finally {
      setMarkingPaid(false)
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0)
  const ivaRate = configuracion?.iva_porcentaje || 21
  const iva = subtotal * (ivaRate / 100)
  const total = subtotal + iva

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <Header title="Factura" subtitle="Cargando..." />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#fb5a2e' }}></div>
              <p style={{ color: '#4c4c4c' }}>Cargando factura...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !factura) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <Header title="Factura" subtitle="Error" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg font-medium mb-4" style={{ color: '#232323' }}>
                {error || 'Factura no encontrada'}
              </p>
              <Link href="/dashboard/facturas">
                <Button variant="outline">Volver a Facturas</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <Header title="Factura" subtitle={`N°: ${factura.numero}`} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#232323' }}>
                Factura N°: {factura.numero}
              </h1>
              <p className="text-sm mt-1" style={{ color: '#4c4c4c' }}>
                Detalles de la factura y vista previa del PDF
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {factura.estado === 'pendiente' && (
                <Button
                  onClick={handleMarkAsPaid}
                  disabled={markingPaid}
                  style={{ backgroundColor: '#fb5a2e', color: 'white' }}
                >
                  {markingPaid ? 'Procesando...' : 'Marcar como Pagada'}
                </Button>
              )}
              <button
                onClick={async () => {
                  const blob = await pdf(
                    <FacturaPDF
                      factura={factura}
                      cliente={cliente}
                      items={items}
                      configuracion={configuracion || {
                        nombre_empresa: 'willou',
                        direccion_empresa: '',
                        telefono_empresa: '',
                        correo_empresa: ''
                      }}
                    />
                  ).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `factura-${factura.numero}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-6 py-3 rounded-xl border border-willou-orange text-willou-orange hover:bg-willou-orange hover:text-white transition-all duration-200"
              >
                Descargar PDF
              </button>
              <Link href="/dashboard/facturas">
                <Button variant="outline" style={{ borderColor: '#d7bdff', color: '#4c4c4c' }}>
                  Volver
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#232323' }}>
                  Información de la Factura
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ color: '#4c4c4c' }}>Número:</span>
                    <span className="font-medium" style={{ color: '#232323' }}>{factura.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#4c4c4c' }}>Fecha de emisión:</span>
                    <span className="font-medium" style={{ color: '#232323' }}>
                      {formatDate(factura.fecha_emision)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#4c4c4c' }}>Vencimiento:</span>
                    <span className="font-medium" style={{ color: '#232323' }}>
                      {formatDate(factura.fecha_vencimiento)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: '#4c4c4c' }}>Estado:</span>
                    <Badge
                      variant={factura.estado === 'pagada' ? 'success' : 'warning'}
                    >
                      {factura.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#232323' }}>
                  Información del Cliente
                </h2>
                {cliente ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span style={{ color: '#4c4c4c' }}>Nombre:</span>
                      <span className="font-medium" style={{ color: '#232323' }}>{cliente.nombre}</span>
                    </div>
                    {cliente.empresa && (
                      <div className="flex justify-between">
                        <span style={{ color: '#4c4c4c' }}>Empresa:</span>
                        <span className="font-medium" style={{ color: '#232323' }}>{cliente.empresa}</span>
                      </div>
                    )}
                    {cliente.direccion && (
                      <div className="flex justify-between">
                        <span style={{ color: '#4c4c4c' }}>Dirección:</span>
                        <span className="font-medium text-right max-w-[200px]" style={{ color: '#232323' }}>
                          {cliente.direccion}
                        </span>
                      </div>
                    )}
                    {cliente.cif && (
                      <div className="flex justify-between">
                        <span style={{ color: '#4c4c4c' }}>CIF:</span>
                        <span className="font-medium" style={{ color: '#232323' }}>{cliente.cif}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span style={{ color: '#4c4c4c' }}>Correo:</span>
                      <span className="font-medium" style={{ color: '#232323' }}>{cliente.correo}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#4c4c4c' }}>Sin información de cliente</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#232323' }}>
                Detalles de la Factura
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <th className="text-left py-3 px-2" style={{ color: '#4c4c4c' }}>N°</th>
                      <th className="text-left py-3 px-2" style={{ color: '#4c4c4c' }}>Servicio</th>
                      <th className="text-right py-3 px-2" style={{ color: '#4c4c4c' }}>Cantidad</th>
                      <th className="text-right py-3 px-2" style={{ color: '#4c4c4c' }}>Precio</th>
                      <th className="text-right py-3 px-2" style={{ color: '#4c4c4c' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} style={{ borderTop: '1px solid #e5e5e5' }}>
                        <td className="py-3 px-2" style={{ color: '#232323' }}>{index + 1}</td>
                        <td className="py-3 px-2" style={{ color: '#232323' }}>{item.descripcion}</td>
                        <td className="text-right py-3 px-2" style={{ color: '#232323' }}>{item.cantidad}</td>
                        <td className="text-right py-3 px-2" style={{ color: '#232323' }}>
                          {formatCurrency(item.precio_unitario)}
                        </td>
                        <td className="text-right py-3 px-2" style={{ color: '#232323' }}>
                          {formatCurrency(item.cantidad * item.precio_unitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {items.length === 0 && (
                <div className="text-center py-8">
                  <p style={{ color: '#4c4c4c' }}>No hay items en esta factura</p>
                </div>
              )}

              <div className="mt-6 pt-4" style={{ borderTop: '2px solid #e5e5e5' }}>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: '#4c4c4c' }}>Subtotal:</span>
                    <span className="font-medium" style={{ color: '#232323' }}>
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#4c4c4c' }}>IVA ({ivaRate}%):</span>
                    <span className="font-medium" style={{ color: '#232323' }}>
                      {formatCurrency(iva)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #e5e5e5' }}>
                    <span className="text-lg font-bold" style={{ color: '#232323' }}>Total:</span>
                    <span className="text-lg font-bold" style={{ color: '#fb5a2e' }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#232323' }}>
              Vista Previa del PDF
            </h2>
            <div className="w-full overflow-hidden rounded-lg" style={{ border: '1px solid #e5e5e5' }}>
              <PDFViewer width="100%" height={800} showToolbar={false}>
                <FacturaPDF
                  factura={factura}
                  cliente={cliente}
                  items={items}
                  configuracion={configuracion || {
                    nombre_empresa: 'willou',
                    direccion_empresa: '',
                    telefono_empresa: '',
                    correo_empresa: ''
                  }}
                />
              </PDFViewer>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
