
'use client';

import * as React from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProductTable from '@/components/products/product-table';
import AddProductDialog from '@/components/products/add-product-dialog';
import type { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/hooks/use-search';
import { Input } from '../ui/input';

type ProductPageContentProps = {
    initialProducts: Product[];
};

export default function ProductPageContent({ initialProducts }: ProductPageContentProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const router = useRouter();
  const { searchTerm, setSearchTerm } = useSearch();

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">
            Products & Services
          </h1>
          <p className="text-muted-foreground">
            Manage your product and service catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
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
