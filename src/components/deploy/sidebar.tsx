"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Server,
  Database,
  Package,
  Activity,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Rocket,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const mainNavigation = [
  { name: "Projects", href: "/deploy", icon: LayoutGrid, exact: true },
  { name: "Servers", href: "/deploy/servers", icon: Server },
  { name: "Databases", href: "/deploy/databases", icon: Database },
  {
    name: "Services",
    href: "/deploy/services",
    icon: Package,
    comingSoon: true,
  },
  { name: "Monitoring", href: "/deploy/monitoring", icon: Activity },
  { name: "Notifications", href: "/deploy/notifications", icon: Bell },
];

const systemNavigation = [
  { name: "Team", href: "/deploy/team", icon: Users },
  { name: "Settings", href: "/deploy/settings", icon: Settings },
];

export function DeploySidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-zinc-950 text-zinc-100 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
              <Rocket className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">DevDeploy</span>
              <Badge
                variant="outline"
                className="ml-2 border-violet-500 py-0 text-[10px] text-violet-400"
              >
                Beta
              </Badge>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
            <Rocket className="h-4 w-4" />
          </div>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute left-14 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {!collapsed && (
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Platform
          </p>
        )}
        {mainNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href, item.exact)
                ? "bg-violet-600/20 text-violet-400"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? item.name : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="flex items-center gap-2">
                {item.name}
                {item.comingSoon && (
                  <Badge
                    variant="outline"
                    className="border-violet-500/30 px-1.5 py-0 text-[9px] text-violet-400"
                  >
                    Soon
                  </Badge>
                )}
              </span>
            )}
          </Link>
        ))}

        {!collapsed && (
          <p className="mt-4 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            System
          </p>
        )}
        {collapsed && <div className="my-2 border-t border-zinc-800" />}
        {systemNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-violet-600/20 text-violet-400"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? item.name : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="border-t border-zinc-800 p-2">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Back to Dashboard" : undefined}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Back to Dashboard</span>}
        </Link>
      </div>
    </aside>
  );
}
