import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ProductTable from '@/components/products/product-table';
import { products } from '@/lib/data';

export default function ProductsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Products & Services</h1>
          <p className="text-muted-foreground">Manage your product and service catalog.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <ProductTable products={products} />
        </CardContent>
      </Card>
    </div>
  );
}
