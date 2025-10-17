"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Network, Tag, Calendar, Users, Music, Heart, ListMusic, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

const routes = [
  { href: "/", label: "Home", icon: Home },
  { href: "/collab-network", label: "Collab Network", icon: Network },
  { href: "/label-lens", label: "Label Lens", icon: Tag },
  { href: "/release-cohorts", label: "Release Cohorts", icon: Calendar },
  { href: "/artist-board", label: "Artist Board", icon: Users },
  { href: "/track-explorer", label: "Track Explorer", icon: Music },
  { href: "/library", label: "Library", icon: Heart },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-8">
        <div className="flex-1">
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <div className="relative h-8 w-8 transition-transform duration-300 group-hover:scale-110">
              <Image
                src="/logo.png"
                alt="Statify Logo"
                width={32}
                height={32}
                className="h-full w-auto object-contain drop-shadow-md"
              />
            </div>
            <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Statify
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "hover:bg-accent/50 active:scale-95",
                  isActive
                    ? "text-foreground bg-accent shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                <span className="hidden lg:inline-block">{route.label}</span>
                {isActive && (
                  <div className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex-1 flex justify-end items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button variant="default" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
