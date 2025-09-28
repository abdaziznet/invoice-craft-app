'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProductTable from '@/components/products/product-table';
import AddProductDialog from '@/components/products/add-product-dialog';
import type { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';

type ProductPageContentProps = {
    initialProducts: Product[];
};

export default function ProductPageContent({ initialProducts }: ProductPageContentProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const refreshProducts = () => {
    router.refresh();
  };

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
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <ProductTable
            products={products}
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
