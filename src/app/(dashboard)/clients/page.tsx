'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { useClientStore } from '@/store/use-client-store';
import { ClientDialog } from './components/client-dialog';
import { DeleteDialog } from './components/delete-dialog';
import { Client } from '@/types';

export default function ClientsPage() {
  const {
    clients,
    fetchClients,
  } = useClientStore();

  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">クライアント管理</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規作成
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={clients}
        meta={{
          onEdit: handleEdit,
          onDelete: handleDelete,
        }}
      />

      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        client={selectedClient}
      />

      {selectedClient && (
        <DeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          client={selectedClient}
        />
      )}
    </div>
  );
} 