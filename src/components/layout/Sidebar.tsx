'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  GitCompare,
  Bookmark,
  Type,
  BookOpen,
  History,
  Settings,
  Leaf,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Photo Studio', href: '/studio', icon: Camera },
  { label: 'Product Research', href: '/research', icon: Search },
  { label: 'Title & SEO Generator', href: '/titles', icon: Type },
  { label: 'Etsy Style Guide', href: '/references', icon: BookOpen },
  { label: 'Settings & APIs', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <img
          src="/brand/ravidstudio-horizontal.png"
          alt="RavidStudio"
          className="h-9 object-contain"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-emerald-600' : 'text-gray-400')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Ceramic Matcha Niche • Etsy US</p>
      </div>
    </aside>
  );
}
