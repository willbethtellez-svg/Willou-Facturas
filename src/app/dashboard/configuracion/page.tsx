'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function ConfiguracionPage() {
  const { configuracion, setConfiguracion } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    numero_factura_actual: 1,
    iva_porcentaje: 16,
    nombre_empresa: '',
    direccion_empresa: '',
    telefono_empresa: '',
    correo_empresa: '',
    logo_url: '',
    color_principal: '#fb5a2e',
    color_secundario: '#d7bdff',
  })

  useEffect(() => {
    if (configuracion) {
      setForm({
        numero_factura_actual: configuracion.numero_factura_actual,
        iva_porcentaje: configuracion.iva_porcentaje,
        nombre_empresa: configuracion.nombre_empresa,
        direccion_empresa: configuracion.direccion_empresa,
        telefono_empresa: configuracion.telefono_empresa,
        correo_empresa: configuracion.correo_empresa,
        logo_url: configuracion.logo_url || '',
        color_principal: configuracion.color_principal,
        color_secundario: configuracion.color_secundario,
      })
    }
  }, [configuracion])

  const handleSave = async () => {
    setLoading(true)
    try {
      if (!configuracion?.id) {
        toast.error('No se encontró la configuración')
        return
      }

      const { error } = await supabase
        .from('configuracion')
        .update({
          numero_factura_actual: form.numero_factura_actual,
          iva_porcentaje: form.iva_porcentaje,
          nombre_empresa: form.nombre_empresa,
          direccion_empresa: form.direccion_empresa,
          telefono_empresa: form.telefono_empresa,
          correo_empresa: form.correo_empresa,
          logo_url: form.logo_url || null,
          color_principal: form.color_principal,
          color_secundario: form.color_secundario,
        })
        .eq('id', configuracion.id)

      if (error) throw error

      setConfiguracion({
        ...configuracion,
        ...form,
      })

      toast.success('Configuración guardada correctamente')
    } catch (error) {
      toast.error('Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const siguienteFactura = String(form.numero_factura_actual).padStart(4, '0')
  const ejemploBase = 1000
  const ejemploIVA = ejemploBase * (form.iva_porcentaje / 100)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#232323' }}>
      <Header title="Configuración" subtitle="Ajustes de facturación y datos de empresa" />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Numeración de Facturas */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-2 rounded-full"
                style={{ background: 'linear-gradient(90deg, #fb5a2e, #d7bdff)' }}
              />
              <h2 className="text-lg font-semibold text-white">Numeración de Facturas</h2>
            </div>
            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
              Configura desde qué número empezará la enumeración de tus facturas
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: '#d7bdff' }}>
                Próximo número de factura
              </label>
              <Input
                type="number"
                min={1}
                value={form.numero_factura_actual}
                onChange={(e) =>
                  setForm({ ...form, numero_factura_actual: parseInt(e.target.value) || 1 })
                }
                className="max-w-[180px]"
              />
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                La siguiente factura será N°:{' '}
                <span className="font-mono font-semibold" style={{ color: '#fb5a2e' }}>
                  {siguienteFactura}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Impuestos */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-2 rounded-full"
                style={{ background: 'linear-gradient(90deg, #d7bdff, #fb5a2e)' }}
              />
              <h2 className="text-lg font-semibold text-white">Impuestos</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#d7bdff' }}>
                  Porcentaje de IVA (%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={form.iva_porcentaje}
                  onChange={(e) =>
                    setForm({ ...form, iva_porcentaje: parseFloat(e.target.value) || 0 })
                  }
                  className="max-w-[140px]"
                />
              </div>
              <div
                className="rounded-lg p-3 text-sm"
                style={{ backgroundColor: '#2e2e2e', color: '#9ca3af' }}
              >
                <p className="mb-1">Ejemplo con un producto de $1,000:</p>
                <div className="flex justify-between font-mono">
                  <span>Subtotal:</span>
                  <span className="text-white">${ejemploBase.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>IVA ({form.iva_porcentaje}%):</span>
                  <span className="text-white">${ejemploIVA.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-mono font-semibold mt-1 pt-1 border-t" style={{ borderColor: '#4c4c4c' }}>
                  <span>Total:</span>
                  <span style={{ color: '#fb5a2e' }}>${(ejemploBase + ejemploIVA).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos de la Empresa */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-2 rounded-full"
                style={{ background: 'linear-gradient(90deg, #fb5a2e, #d7bdff)' }}
              />
              <h2 className="text-lg font-semibold text-white">Datos de la Empresa</h2>
            </div>
            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
              Estos datos aparecerán en el encabezado y pie de tus facturas
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#d7bdff' }}>
                  Nombre de la empresa
                </label>
                <Input
                  value={form.nombre_empresa}
                  onChange={(e) => setForm({ ...form, nombre_empresa: e.target.value })}
                  placeholder="Mi Empresa S.A. de C.V."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#d7bdff' }}>
                  Correo electrónico
                </label>
                <Input
                  type="email"
                  value={form.correo_empresa}
                  onChange={(e) => setForm({ ...form, correo_empresa: e.target.value })}
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#d7bdff' }}>
                  Dirección
                </label>
                <Input
                  value={form.direccion_empresa}
                  onChange={(e) => setForm({ ...form, direccion_empresa: e.target.value })}
                  placeholder="Calle, Número, Colonia, Ciudad, CP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#d7bdff' }}>
                  Teléfono
                </label>
                <Input
                  value={form.telefono_empresa}
                  onChange={(e) => setForm({ ...form, telefono_empresa: e.target.value })}
                  placeholder="+52 (55) 1234-5678"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Almacenamiento de Assets */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-2 rounded-full"
                style={{ background: 'linear-gradient(90deg, #d7bdff, #fb5a2e)' }}
              />
              <h2 className="text-lg font-semibold text-white">Recursos y Assets</h2>
            </div>
            <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
              Sube tu logo, fondos y otros recursos para las facturas
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-[#fb5a2e]"
                style={{ borderColor: '#4c4c4c' }}
                onClick={() => toast('Funcionalidad de subida pendiente de configurar Supabase Storage', { icon: 'ℹ️' })}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-10 h-10"
                    style={{ color: '#4c4c4c' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6v12m6-6H6"
                    />
                  </svg>
                  <p className="text-sm font-medium text-white">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>
                    PNG, JPG, SVG — Máximo 5MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#2e2e2e' }}
                  >
                    <span className="text-xs" style={{ color: '#4c4c4c' }}>
                      Asset {i}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guardar */}
        <div className="flex justify-end pt-2 pb-8">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </main>
    </div>
  )
}
