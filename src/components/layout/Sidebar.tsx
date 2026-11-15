'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Type,
  BookOpen,
  Settings,
  Camera,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Photo Studio', href: '/studio', shortLabel: 'Studio', icon: Camera },
  { label: 'Product Research', href: '/research', shortLabel: 'Research', icon: Search },
  { label: 'Title & SEO Generator', href: '/titles', shortLabel: 'Titles', icon: Type },
  { label: 'Etsy Style Guide', href: '/references', shortLabel: 'References', icon: BookOpen },
  { label: 'Settings & APIs', href: '/settings', shortLabel: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* 1. Mobile Top Header Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <Link href="/studio" className="flex items-center gap-2">
          <img
            src="/brand/ravidstudio-horizontal.png"
            alt="RavidStudio"
            className="h-7 object-contain"
          />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* 2. Mobile Drawer Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Menu */}
          <div className="relative w-64 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <img
                src="/brand/ravidstudio-horizontal.png"
                alt="RavidStudio"
                className="h-8 object-contain"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
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

            <div className="px-4 py-4 border-t border-gray-100 text-center">
              <p className="text-[11px] text-gray-400">Ceramic Matcha Niche • Etsy US</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Desktop Left Sidebar */}
      <aside className="hidden md:flex md:w-60 flex-shrink-0 bg-white border-r border-gray-200 flex-col h-screen overflow-y-auto">
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

      {/* 4. Mobile Bottom App Bar (Sticky Thumb Navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 flex items-center justify-around py-1.5 px-1 shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[10px] font-medium transition-colors flex-1 text-center',
                isActive ? 'text-emerald-700 font-bold' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn('w-4 h-4 mb-0.5', isActive ? 'text-emerald-600 scale-110' : 'text-gray-400')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="truncate max-w-[62px] leading-tight">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
