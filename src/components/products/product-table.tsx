'use client';

import *
as React from 'react';
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
import type { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import EditProductDialog from './edit-product-dialog';
import DeleteConfirmationDialog from '../customers/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteProducts } from '@/lib/google-sheets';
import DataTablePagination from '../data-table-pagination';
import { useLocale } from '@/hooks/use-locale';

type ProductTableProps = {
  products: Product[];
  onProductUpdated: () => void;
  onProductDeleted: () => void;
};

export default function ProductTable({ products, onProductUpdated, onProductDeleted }: ProductTableProps) {
  const { toast } = useToast();
  const { t } = useLocale();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = React.useState<string[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [page, setPage] = React.useState(1);
  const pageSize = parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE || '10');

  const paginatedProducts = products.slice((page - 1) * pageSize, page * pageSize);

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProductIds([product.id]);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProducts(selectedProductIds);
      toast({
        title: t('products.toast.deletedTitle'),
        description: t('products.toast.deletedDesc'),
      });
      onProductDeleted();
      setSelectedProductIds([]);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('products.toast.deleteErrorTitle'),
        description: t('products.toast.deleteErrorDesc'),
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(products.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectRow = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds(prev => [...prev, productId]);
    } else {
      setSelectedProductIds(prev => prev.filter(id => id !== productId));
    }
  };

  const numSelected = selectedProductIds.length;
  const rowCount = products.length;

  return (
    <>
      <div className="mb-4 flex items-center gap-2 px-4 sm:px-0">
        {numSelected > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDeleteClick}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('products.table.deleteSelected', { count: numSelected })}
            </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  onCheckedChange={checked => handleSelectAll(checked as boolean)}
                  checked={rowCount > 0 && numSelected === rowCount}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>{t('products.table.header.name')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('products.table.header.unit')}</TableHead>
              <TableHead className="text-right">{t('products.table.header.unitPrice')}</TableHead>
              <TableHead className="text-right w-[50px]">{t('products.table.header.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((product) => (
              <TableRow 
                key={product.id}
                data-state={selectedProductIds.includes(product.id) && "selected"}
              >
                <TableCell>
                  <Checkbox
                    onCheckedChange={checked => handleSelectRow(product.id, checked as boolean)}
                    checked={selectedProductIds.includes(product.id)}
                    aria-label={`Select row ${product.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{product.unit}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.unitPrice)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('products.table.actions.title')}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditClick(product)}>{t('products.table.actions.edit')}</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={() => handleDeleteClick(product)}
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
        count={products.length}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
      />
      {selectedProduct && (
        <EditProductDialog
          product={selectedProduct}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onProductUpdated={() => {
            onProductUpdated();
            setIsEditDialogOpen(false);
          }}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        itemsDescription={numSelected > 1 ? t('products.table.deleteDesc', { count: numSelected }) : t('products.table.deleteDescSingle', { name: products.find(p => p.id === selectedProductIds[0])?.name })}
      />
    </>
  );
}
