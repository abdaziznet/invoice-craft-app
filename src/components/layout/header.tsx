'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  PanelLeft,
  Search,
  LogOut,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/invoices', icon: FileText, label: 'Invoices' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/products', icon: Package, label: 'Products' },
];

const settingsItem = { href: '/settings', icon: Settings, label: 'Settings' };

export default function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const logo = PlaceHolderImages.find((img) => img.id === 'logo');

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SheetHeader>
            <SheetTitle>
              {logo && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 font-semibold"
                >
                  <Image
                    src={logo.imageUrl}
                    width={32}
                    height={32}
                    alt="InvoiceCraft Logo"
                    className="rounded-full"
                    data-ai-hint={logo.imageHint}
                  />
                  <span>InvoiceCraft</span>
                </Link>
              )}
            </SheetTitle>
          </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium mt-4">
            {[...navItems, settingsItem].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="hidden items-center gap-6 md:flex">
        {logo && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <Image
              src={logo.imageUrl}
              width={32}
              height={32}
              alt="InvoiceCraft Logo"
              className="rounded-full"
              data-ai-hint={logo.imageHint}
            />
            <span className="font-bold text-lg">
              Invoice<span className="text-primary">Craft</span>
            </span>
          </Link>
        )}
        <nav className="flex items-center gap-4 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-muted-foreground transition-colors hover:text-foreground',
                pathname.startsWith(item.href) && 'text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <Image
              src={user?.photoURL || '/placeholder-user.jpg'}
              width={36}
              height={36}
              alt="Avatar"
              className="overflow-hidden rounded-full"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {user?.displayName || 'My Account'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
