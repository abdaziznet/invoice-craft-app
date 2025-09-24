'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import ProductTable from '@/components/products/product-table';
import { getProducts } from '@/lib/google-sheets';
import AddProductDialog from '@/components/products/add-product-dialog';
import type { Product } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const router = useRouter();

  const fetchProducts = React.useCallback(async () => {
    const productsData = await getProducts();
    setProducts(productsData as Product[]);
  }, []);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductAdded = () => {
    fetchProducts();
    router.refresh();
  };

  const handleProductUpdated = () => {
    fetchProducts();
    router.refresh();
  };

  const handleProductDeleted = () => {
    fetchProducts();
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Products & Services</h1>
          <p className="text-muted-foreground">Manage your product and service catalog.</p>
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
            onProductUpdated={handleProductUpdated}
            onProductDeleted={handleProductDeleted}
          />
        </CardContent>
      </Card>
      <AddProductDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
}
