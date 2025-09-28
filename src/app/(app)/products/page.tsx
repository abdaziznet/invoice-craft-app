'use server';

import { getProducts } from '@/lib/google-sheets';
import ProductPageContent from '@/components/products/product-page-content';

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductPageContent initialProducts={products} />;
}
