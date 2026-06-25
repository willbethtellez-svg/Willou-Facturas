'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { supabase, formatCurrency, getNextInvoiceNumber, incrementInvoiceCounter } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface ItemFactura {
  id?: string
  servicio_id: string
  nombre: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export default function EditarFacturaPage() {
  const params = useParams()
  const router = useRouter()
  const { clientes, servicios, configuracion, updateFactura } = useAppStore()

  const [facturaId] = useState(params.id as string)
  const [numeroFactura, setNumeroFactura] = useState('')
  const [fechaEmision, setFechaEmision] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null)
  const [items, setItems] = useState<ItemFactura[]>([])
  const [notas, setNotas] = useState('')
  const [aplicaIva, setAplicaIva] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFactura()
  }, [facturaId])

  useEffect(() => {
    if (clienteId) {
      const cliente = clientes.find(c => c.id === clienteId)
      setClienteSeleccionado(cliente || null)
    } else {
      setClienteSeleccionado(null)
    }
  }, [clienteId, clientes])

  async function fetchFactura() {
    try {
      setLoading(true)

      const { data: facturaData, error: facturaError } = await supabase
        .from('facturas')
        .select(`
          *,
          clientes (*),
          factura_items (*, servicios (*))
        `)
        .eq('id', facturaId)
        .single()

      if (facturaError) throw facturaError
      if (!facturaData) {
        toast.error('Factura no encontrada')
        router.push('/dashboard/facturas')
        return
      }

      setNumeroFactura(facturaData.numero)
      setFechaEmision(facturaData.fecha_emision)
      setFechaVencimiento(facturaData.fecha_vencimiento || '')
      setClienteId(facturaData.cliente_id || '')
      setNotas(facturaData.notas || '')
      setAplicaIva(facturaData.iva_porcentaje > 0)

      const fetchedItems = (facturaData.factura_items || []).map((item: any) => ({
        id: item.id,
        servicio_id: item.servicio_id || '',
        nombre: item.servicios?.nombre || '',
        descripcion: item.descripcion || '',
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      }))
      setItems(fetchedItems)
    } catch (err) {
      console.error('Error fetching factura:', err)
      toast.error('Error al cargar la factura')
      router.push('/dashboard/facturas')
    } finally {
      setLoading(false)
    }
  }

  const opcionesClientes = clientes.map(c => ({
    value: c.id,
    label: `${c.nombre}${c.empresa ? ` - ${c.empresa}` : ''}`
  }))

  const opcionesServicios = servicios
    .filter(s => s.activo)
    .map(s => ({
      value: s.id,
      label: `${s.nombre} - ${formatCurrency(s.precio)}`
    }))

  const agregarItem = () => {
    setItems([
      ...items,
      {
        servicio_id: '',
        nombre: '',
        descripcion: '',
        cantidad: 1,
        precio_unitario: 0,
        subtotal: 0
      }
    ])
  }

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const actualizarItem = (index: number, campo: keyof ItemFactura, valor: any) => {
    const nuevosItems = [...items]
    nuevosItems[index] = { ...nuevosItems[index], [campo]: valor }

    if (campo === 'servicio_id') {
      const servicio = servicios.find(s => s.id === valor)
      if (servicio) {
        nuevosItems[index].nombre = servicio.nombre
        nuevosItems[index].precio_unitario = servicio.precio
      }
    }

    nuevosItems[index].subtotal = nuevosItems[index].cantidad * nuevosItems[index].precio_unitario
    setItems(nuevosItems)
  }

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const ivaPorcentaje = configuracion?.iva_porcentaje ?? 16
  const ivaMonto = aplicaIva ? subtotal * ivaPorcentaje / 100 : 0
  const total = subtotal + ivaMonto

  const guardarFactura = async () => {
    if (!clienteId) {
      toast.error('Selecciona un cliente')
      return
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un servicio')
      return
    }

    setGuardando(true)
    try {
      // Get existing items to determine which to delete
      const { data: existingItems } = await supabase
        .from('factura_items')
        .select('id')
        .eq('factura_id', facturaId)

      const existingItemIds = existingItems?.map(i => i.id) || []
      const currentItemIds = items.filter(i => i.id).map(i => i.id!)
      const itemsToDelete = existingItemIds.filter(id => !currentItemIds.includes(id))

      // Delete removed items
      if (itemsToDelete.length > 0) {
        await supabase
          .from('factura_items')
          .delete()
          .in('id', itemsToDelete)
      }

      // Update or insert items
      for (const item of items) {
        if (item.id) {
          // Update existing item
          await supabase
            .from('factura_items')
            .update({
              servicio_id: item.servicio_id || null,
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              subtotal: item.subtotal,
            })
            .eq('id', item.id)
        } else {
          // Insert new item
          await supabase
            .from('factura_items')
            .insert({
              factura_id: facturaId,
              servicio_id: item.servicio_id || null,
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              subtotal: item.subtotal,
            })
        }
      }

      // Update factura totals
      const { error: facturaError } = await supabase
        .from('facturas')
        .update({
          cliente_id: clienteId,
          fecha_emision: fechaEmision,
          fecha_vencimiento: fechaVencimiento || null,
          subtotal,
          iva_porcentaje: aplicaIva ? ivaPorcentaje : 0,
          iva_monto: ivaMonto,
          total,
          notas,
          updated_at: new Date().toISOString()
        })
        .eq('id', facturaId)

      if (facturaError) throw facturaError

      // Update local store
      const updatedFactura = {
        id: facturaId,
        numero: numeroFactura,
        cliente_id: clienteId,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento || null,
        estado: 'pendiente' as const,
        subtotal,
        iva_porcentaje: aplicaIva ? ivaPorcentaje : 0,
        iva_monto: ivaMonto,
        total,
        monto_abonado: 0,
        saldo_pendiente: total,
        notas,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      updateFactura(updatedFactura)

      toast.success('Factura actualizada correctamente')
      router.push(`/dashboard/facturas/${facturaId}`)
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la factura')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Editar Factura" subtitle="Cargando..." />
        <main className="max-w-7xl mx-auto px-4 py-8">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Editar Factura" subtitle={`Factura N°: ${numeroFactura}`} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-willou-dark">Editar Factura</h1>
          <p className="text-willou-gray mt-1">Factura N°: {numeroFactura}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-willou-dark mb-4">Información de la Factura</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Número de Factura"
                    value={numeroFactura}
                    disabled
                  />
                  <Input
                    label="Fecha de Emisión"
                    type="date"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                  />
                  <Input
                    label="Fecha de Vencimiento"
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-willou-dark">Cliente</h2>
                  <Link href="/dashboard/clientes/nuevo">
                    <Button variant="outline" size="sm">
                      + Nuevo Cliente
                    </Button>
                  </Link>
                </div>
                <Select
                  label="Seleccionar Cliente"
                  options={[{ value: '', label: 'Seleccionar cliente...' }, ...opcionesClientes]}
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                />
                {clienteSeleccionado && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-willou-dark">{clienteSeleccionado.nombre}</p>
                    {clienteSeleccionado.empresa && (
                      <p className="text-sm text-willou-gray">{clienteSeleccionado.empresa}</p>
                    )}
                    {clienteSeleccionado.direccion && (
                      <p className="text-sm text-willou-gray">{clienteSeleccionado.direccion}</p>
                    )}
                    <div className="flex gap-4 mt-2">
                      {clienteSeleccionado.cif && (
                        <p className="text-sm text-willou-gray">CIF: {clienteSeleccionado.cif}</p>
                      )}
                      {clienteSeleccionado.correo && (
                        <p className="text-sm text-willou-gray">Correo: {clienteSeleccionado.correo}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-willou-dark mb-4">Servicios</h2>
                {items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 text-sm font-medium text-willou-gray">N°</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-willou-gray">Servicio</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-willou-gray">Producto</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-willou-gray">Cant.</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-willou-gray">Precio</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-willou-gray">Subtotal</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-willou-gray"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-2 text-sm font-medium text-willou-dark">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td className="py-3 px-2">
                              <Select
                                options={[{ value: '', label: 'Seleccionar...' }, ...opcionesServicios]}
                                value={item.servicio_id}
                                onChange={(e) => actualizarItem(index, 'servicio_id', e.target.value)}
                              />
                            </td>
                            <td className="py-3 px-2">
                              <Input
                                value={item.descripcion}
                                onChange={(e) => actualizarItem(index, 'descripcion', e.target.value)}
                                placeholder="Nombre del producto..."
                              />
                            </td>
                            <td className="py-3 px-2" style={{ width: 70 }}>
                              <Input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                              />
                            </td>
                            <td className="py-3 px-2" style={{ width: 100 }}>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.precio_unitario}
                                onChange={(e) => actualizarItem(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="py-3 px-2 text-sm font-medium text-willou-dark" style={{ width: 100 }}>
                              ${formatCurrency(item.subtotal)}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <button
                                onClick={() => eliminarItem(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-willou-gray">
                    <p>No hay servicios agregados</p>
                    <p className="text-sm">Haz clic en "Agregar Servicio" para comenzar</p>
                  </div>
                )}
                <div className="mt-4">
                  <Button variant="outline" onClick={agregarItem}>
                    + Agregar Servicio
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-willou-dark mb-4">Notas</h2>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-willou-orange focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Notas adicionales para la factura..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-willou-dark mb-4">Resumen</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-willou-gray">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-willou-gray">
                      <input
                        type="checkbox"
                        checked={aplicaIva}
                        onChange={(e) => setAplicaIva(e.target.checked)}
                        className="rounded text-willou-orange focus:ring-willou-orange"
                      />
                      IVA ({ivaPorcentaje}%)
                    </label>
                    <span className="font-medium">{formatCurrency(ivaMonto)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-willou-dark">Total</span>
                      <span className="text-lg font-bold text-willou-orange">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    className="w-full"
                    onClick={guardarFactura}
                    disabled={guardando}
                  >
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Link href={`/dashboard/facturas/${facturaId}`} className="block">
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
