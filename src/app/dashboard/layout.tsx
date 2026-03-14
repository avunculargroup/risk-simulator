"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Bell, Sun, Moon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/position", label: "Position", icon: Wallet },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    try { localStorage.setItem("bts-theme", isDark ? "dark" : "light"); } catch {}
  };

  return (
    <aside className="flex h-full w-sidebar flex-col border-r border-bts-border bg-bts-surface">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-bts-border px-4 py-4">
        <div>
          <p className="font-display text-subsection text-bts-primary">Treasury Risk</p>
          <p className="text-caption text-bts-tertiary">BTC Simulator</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-bts-tertiary hover:text-bts-secondary">
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-semibold transition-colors",
              pathname === href
                ? "bg-bts-gold-glow text-bts-gold-dark"
                : "text-bts-secondary hover:bg-bts-surface-subtle hover:text-bts-primary"
            )}
          >
            <Icon size={16} strokeWidth={1.5} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-bts-border p-3">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-body-sm text-bts-secondary hover:bg-bts-surface-subtle hover:text-bts-primary transition-colors"
        >
          <Sun size={14} strokeWidth={1.5} className="dark:hidden" />
          <Moon size={14} strokeWidth={1.5} className="hidden dark:block" />
          <span className="dark:hidden">Light mode</span>
          <span className="hidden dark:block">Dark mode</span>
        </button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bts-bg overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex w-sidebar">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-bts-border bg-bts-surface px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1 text-bts-secondary hover:text-bts-primary"
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
          <p className="font-display text-subsection text-bts-primary">Treasury Risk</p>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
