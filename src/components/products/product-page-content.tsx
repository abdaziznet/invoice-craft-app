
'use client';

import * as React from 'react';
import { PlusCircle, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProductTable from '@/components/products/product-table';
import AddProductDialog from '@/components/products/add-product-dialog';
import type { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/hooks/use-search';
import { Input } from '../ui/input';
import { useLocale } from '@/hooks/use-locale';

type ProductPageContentProps = {
    initialProducts: Product[];
};

export default function ProductPageContent({ initialProducts }: ProductPageContentProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const router = useRouter();
  const { searchTerm, setSearchTerm } = useSearch();
  const { t } = useLocale();

  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const refreshProducts = () => {
    router.refresh();
  };

  const filteredProducts = React.useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Unit', 'Unit Price'];
    const data = filteredProducts.map(product => [
      product.id,
      product.name,
      product.unit,
      product.unitPrice,
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">
            {t('products.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('products.description')}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('products.searchPlaceholder')}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button size="sm" variant="outline" onClick={handleExport} className="w-full md:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {t('common.export')}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('products.addNew')}
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0 sm:p-6">
          <ProductTable
            products={filteredProducts}
            onProductUpdated={refreshProducts}
            onProductDeleted={refreshProducts}
          />
        </CardContent>
      </Card>
      <AddProductDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onProductAdded={refreshProducts}
      />
    </div>
  );
}
