'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function NuevoClientePage() {
  const router = useRouter();
  const { addCliente } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    direccion: '',
    cif: '',
    correo: '',
    telefono: '',
    notas: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('clientes')
      .insert([formData])
      .select()
      .single();

    if (error) {
      toast.error('Error al crear el cliente');
      setLoading(false);
      return;
    }

    addCliente(data);
    toast.success('Cliente creado correctamente');
    router.push('/dashboard/clientes');
  };

  return (
    <div>
      <Header title="Nuevo Cliente" subtitle="Agregar un nuevo cliente a tu cartera" />

      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre del contacto"
              required
            />

            <Input
              label="Empresa"
              value={formData.empresa}
              onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
              placeholder="Nombre de la empresa"
            />

            <Input
              label="Correo Electrónico"
              type="email"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              placeholder="correo@ejemplo.com"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+1 (000) 000-0000"
              />
              <Input
                label="CIF/NIT"
                value={formData.cif}
                onChange={(e) => setFormData({ ...formData, cif: e.target.value })}
                placeholder="B01692250"
              />
            </div>

            <Input
              label="Dirección"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Dirección completa"
            />

            <div>
              <label className="block text-sm font-medium text-willou-dark mb-2">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales sobre el cliente..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={loading}>
                Guardar Cliente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
