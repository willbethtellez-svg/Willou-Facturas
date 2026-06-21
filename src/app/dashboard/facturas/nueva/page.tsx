'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { supabase, formatCurrency, getNextInvoiceNumber, incrementInvoiceCounter } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import toast from 'react-hot-toast'

interface ItemFactura {
  servicio_id: string
  nombre: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export default function NuevaFacturaPage() {
  const router = useRouter()
  const { clientes, servicios, configuracion, addFactura } = useAppStore()

  const [numeroFactura, setNumeroFactura] = useState('')
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0])
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [clienteId, setClienteId] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null)
  const [items, setItems] = useState<ItemFactura[]>([])
  const [notas, setNotas] = useState('')
  const [aplicaIva, setAplicaIva] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function loadNumero() {
      const num = await getNextInvoiceNumber()
      setNumeroFactura(num)
    }
    loadNumero()
  }, [])

  useEffect(() => {
    if (clienteId) {
      const cliente = clientes.find(c => c.id === clienteId)
      setClienteSeleccionado(cliente || null)
    } else {
      setClienteSeleccionado(null)
    }
  }, [clienteId, clientes])

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

  const guardarFactura = async (verPdf = false) => {
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
      const { data: factura, error: facturaError } = await supabase
        .from('facturas')
        .insert({
          numero: numeroFactura,
          fecha_emision: fechaEmision,
          fecha_vencimiento: fechaVencimiento,
          cliente_id: clienteId,
          subtotal,
          iva_porcentaje: aplicaIva ? ivaPorcentaje : 0,
          iva_monto: ivaMonto,
          total,
          notas,
          estado: 'pendiente'
        })
        .select()
        .single()

      if (facturaError) throw facturaError

      const itemsParaInsertar = items.map(item => ({
        factura_id: factura.id,
        servicio_id: item.servicio_id,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      }))

      const { error: itemsError } = await supabase
        .from('factura_items')
        .insert(itemsParaInsertar)

      if (itemsError) throw itemsError

      // Incrementar el contador de facturas
      await incrementInvoiceCounter()

      toast.success('Factura guardada correctamente')
      if (verPdf) {
        router.push(`/dashboard/facturas/${factura.id}`)
      } else {
        router.push('/dashboard/facturas')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la factura')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Nueva Factura" subtitle={`Factura N°: ${numeroFactura}`} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-willou-dark">Nueva Factura</h1>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/clientes/nuevo')}
                  >
                    + Nuevo Cliente
                  </Button>
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
                        <p className="text-sm text-willou-gray">{clienteSeleccionado.correo}</p>
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
                    onClick={() => guardarFactura(false)}
                    disabled={guardando}
                  >
                    {guardando ? 'Guardando...' : 'Guardar Factura'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => guardarFactura(true)}
                    disabled={guardando}
                  >
                    Guardar y Ver PDF
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.back()}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
