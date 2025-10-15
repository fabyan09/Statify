"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Network, Tag, Calendar, Users, Music } from "lucide-react";

const routes = [
  { href: "/", label: "Home", icon: Home },
  { href: "/collab-network", label: "Collab Network", icon: Network },
  { href: "/label-lens", label: "Label Lens", icon: Tag },
  { href: "/release-cohorts", label: "Release Cohorts", icon: Calendar },
  { href: "/artist-board", label: "Artist Board", icon: Users },
  { href: "/track-explorer", label: "Track Explorer", icon: Music },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8 py-4">
      <div className="flex items-center space-x-2 mr-8">
        <Music className="h-6 w-6" />
        <span className="font-bold text-xl">Statify</span>
      </div>
      {routes.map((route) => {
        const Icon = route.icon;
        const isActive = pathname === route.href;
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
              isActive
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
