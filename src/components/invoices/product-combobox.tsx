'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Product } from '@/lib/types';
import { useLocale } from '@/hooks/use-locale';

type ProductComboboxProps = {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
};

export function ProductCombobox({
  products,
  value,
  onChange,
}: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { t } = useLocale();
  const selectedProduct = products.find((p) => p.id === value);


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProduct
            ? selectedProduct.name
            : t('invoices.form.selectItem')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder={t('products.searchPlaceholder')}
          />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name} // The value `cmdk` uses for searching. Should be the product name.
                  onSelect={() => {
                    onChange(product.id === value ? "" : product.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === product.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {product.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
