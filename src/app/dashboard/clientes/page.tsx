'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function ClientesPage() {
  const { clientes, deleteCliente } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.correo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    const { error } = await supabase.from('clientes').delete().eq('id', deleteModal.id);
    if (error) {
      toast.error('Error al eliminar el cliente');
    } else {
      deleteCliente(deleteModal.id);
      toast.success('Cliente eliminado correctamente');
    }
    setDeleteModal({ isOpen: false, id: null });
  };

  return (
    <div>
      <Header
        title="Clientes"
        subtitle="Gestiona tu cartera de clientes"
        actions={
          <Link href="/dashboard/clientes/nuevo">
            <Button>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Cliente
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-3 rounded-xl border border-gray-200 focus:border-willou-orange focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200"
        />
      </div>

      {/* Clients List */}
      {filteredClientes.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            title="No hay clientes"
            description="Comienza agregando tu primer cliente para poder crear facturas"
            actionLabel="Agregar Cliente"
            onAction={() => window.location.href = '/dashboard/clientes/nuevo'}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientes.map((cliente) => (
            <Card key={cliente.id} className="card-hover">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 gradient-willou rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {cliente.nombre.charAt(0)}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/clientes/${cliente.id}`}
                      className="p-2 text-willou-gray hover:text-willou-orange hover:bg-orange-50 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, id: cliente.id })}
                      className="p-2 text-willou-gray hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-willou-dark text-lg">{cliente.nombre}</h3>
                {cliente.empresa && (
                  <p className="text-willou-gray text-sm">{cliente.empresa}</p>
                )}

                <div className="mt-4 space-y-2 text-sm text-willou-gray">
                  {cliente.correo && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{cliente.correo}</span>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{cliente.telefono}</span>
                    </div>
                  )}
                  {cliente.cif && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{cliente.cif}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        title="Eliminar Cliente"
      >
        <p className="text-willou-gray mb-6">
          ¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => setDeleteModal({ isOpen: false, id: null })}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
