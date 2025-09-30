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
import type { Customer, Invoice } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import EditCustomerDialog from './edit-customer-dialog';
import DeleteConfirmationDialog from './delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteCustomers, getInvoices } from '@/lib/google-sheets';
import DataTablePagination from '../data-table-pagination';
import { useLocale } from '@/hooks/use-locale';

type CustomerTableProps = {
  customers: Customer[];
  onCustomerUpdated: () => void;
  onCustomerDeleted: () => void;
};

export default function CustomerTable({ customers, onCustomerUpdated, onCustomerDeleted }: CustomerTableProps) {
  const { toast } = useToast();
  const { t } = useLocale();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [customersToDelete, setCustomersToDelete] = React.useState<string[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = React.useState<string[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);

  const [page, setPage] = React.useState(1);
  const pageSize = parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE || '10');

  const paginatedCustomers = customers.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    async function fetchInvoices() {
      const allInvoices = await getInvoices();
      setInvoices(allInvoices);
    }
    fetchInvoices();
  }, []);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (customerIds: string[]) => {
    const customersWithInvoices = customerIds.filter(customerId => 
      invoices.some(invoice => invoice.customer?.id === customerId)
    );

    if (customersWithInvoices.length > 0) {
      const customerNames = customers.filter(c => customersWithInvoices.includes(c.id)).map(c => c.name).join(', ');
      toast({
        variant: 'destructive',
        title: t('customers.toast.deleteBlockedTitle'),
        description: t('customers.toast.deleteBlockedDesc', { names: customerNames }),
      });
      return;
    }
    
    setCustomersToDelete(customerIds);
    setIsDeleteDialogOpen(true);
  }

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomers(customersToDelete);
      toast({
        title: t('customers.toast.deletedTitle'),
        description: t('customers.toast.deletedDesc'),
      });
      onCustomerDeleted();
      setSelectedCustomerIds([]);
      setCustomersToDelete([]);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('customers.toast.deleteErrorTitle'),
        description: t('customers.toast.deleteErrorDesc'),
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomerIds(customers.map(c => c.id));
    } else {
      setSelectedCustomerIds([]);
    }
  }

  const handleSelectRow = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomerIds(prev => [...prev, customerId]);
    } else {
      setSelectedCustomerIds(prev => prev.filter(id => id !== customerId));
    }
  }

  const numSelected = selectedCustomerIds.length;
  const rowCount = customers.length;


  return (
    <>
      <div className="mb-4 flex items-center gap-2 px-4 sm:px-0">
        {numSelected > 0 && (
            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(selectedCustomerIds)}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('customers.table.deleteSelected', { count: numSelected })}
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
              <TableHead>{t('customers.table.header.name')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('customers.table.header.email')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('customers.table.header.phone')}</TableHead>
              <TableHead className="text-right w-[50px]">{t('customers.table.header.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.map((customer) => (
              <TableRow 
                key={customer.id}
                data-state={selectedCustomerIds.includes(customer.id) && "selected"}
              >
                <TableCell>
                  <Checkbox 
                    onCheckedChange={(checked) => handleSelectRow(customer.id, checked as boolean)}
                    checked={selectedCustomerIds.includes(customer.id)}
                    aria-label={`Select row ${customer.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://picsum.photos/seed/${customer.id}/40/40`} alt="Avatar" data-ai-hint="person portrait"/>
                      <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                    </Avatar>
                    {customer.name}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{customer.email}</TableCell>
                <TableCell className="hidden lg:table-cell">{customer.phone}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('customers.table.actions.title')}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditClick(customer)}>{t('customers.table.actions.edit')}</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={() => handleDeleteClick([customer.id])}
                      >
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        count={customers.length}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
      />
      {selectedCustomer && (
        <EditCustomerDialog
          customer={selectedCustomer}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onCustomerUpdated={() => {
            onCustomerUpdated();
            setIsEditDialogOpen(false);
          }}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        itemsDescription={customersToDelete.length > 1 ? t('customers.table.deleteDesc', { count: customersToDelete.length }) : t('customers.table.deleteDescSingle', { name: customers.find(c => c.id === customersToDelete[0])?.name })}
      />
    </>
  );
}
