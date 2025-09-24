'use client';

import * as React from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Client } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import EditClientDialog from './edit-client-dialog';
import DeleteConfirmationDialog from './delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteClients } from '@/lib/google-sheets';
import Spinner from '../ui/spinner';

type ClientTableProps = {
  clients: Client[];
  onClientUpdated: () => void;
  onClientDeleted: () => void;
};

export default function ClientTable({ clients, onClientUpdated, onClientDeleted }: ClientTableProps) {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [selectedClientIds, setSelectedClientIds] = React.useState<string[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (client: Client) => {
    setSelectedClientIds([client.id]);
    setIsDeleteDialogOpen(true);
  }

  const handleBulkDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  }

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteClients(selectedClientIds);
      toast({
        title: 'Clients Deleted',
        description: 'The selected clients have been successfully deleted.',
      });
      onClientDeleted();
      setSelectedClientIds([]);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to Delete Clients',
        description: 'An error occurred while deleting the clients. Please try again.',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientIds(clients.map(c => c.id));
    } else {
      setSelectedClientIds([]);
    }
  }

  const handleSelectRow = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClientIds(prev => [...prev, clientId]);
    } else {
      setSelectedClientIds(prev => prev.filter(id => id !== clientId));
    }
  }

  const numSelected = selectedClientIds.length;
  const rowCount = clients.length;


  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        {numSelected > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDeleteClick}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({numSelected})
            </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox 
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  checked={rowCount > 0 && numSelected === rowCount}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow 
                key={client.id}
                data-state={selectedClientIds.includes(client.id) && "selected"}
              >
                <TableCell>
                  <Checkbox 
                    onCheckedChange={(checked) => handleSelectRow(client.id, checked as boolean)}
                    checked={selectedClientIds.includes(client.id)}
                    aria-label={`Select row ${client.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://picsum.photos/seed/${client.id}/40/40`} alt="Avatar" data-ai-hint="person portrait"/>
                      <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    {client.name}
                  </div>
                </TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditClick(client)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem>View Invoices</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={() => handleDeleteClick(client)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedClient && (
        <EditClientDialog
          client={selectedClient}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onClientUpdated={() => {
            onClientUpdated();
            setIsEditDialogOpen(false);
          }}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        itemsDescription={numSelected > 1 ? `${numSelected} clients` : `client "${clients.find(c => c.id === selectedClientIds[0])?.name}"`}
      />
    </>
  );
}
