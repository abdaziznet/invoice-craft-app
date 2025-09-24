'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Users,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/invoices', icon: FileText, label: 'Invoices' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/products', icon: Package, label: 'Products' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const logo = PlaceHolderImages.find((img) => img.id === 'logo');

  return (
    <SidebarProvider>
      <Sidebar
        className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-card sm:flex"
        collapsible="icon"
      >
        <SidebarHeader className="p-2 justify-center">
            {logo && (
              <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Image
                  src={logo.imageUrl}
                  width={32}
                  height={32}
                  alt="InvoiceCraft Logo"
                  className="rounded-full"
                  data-ai-hint={logo.imageHint}
                />
                <span className="sr-only">InvoiceCraft</span>
              </Link>
            )}
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    variant="default"
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label, side: 'right' }}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarContent className="flex-1" />
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton
                  variant="default"
                  isActive={pathname === '/settings'}
                  tooltip={{ children: 'Settings', side: 'right' }}
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
