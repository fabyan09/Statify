"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Network, Tag, Calendar, Search, Heart, ListMusic, LogOut, User, Sparkles, Menu, X } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

const routes = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/discover", label: "Discover", icon: Sparkles },
  { href: "/collab-network", label: "Collab Network", icon: Network },
  { href: "/label-lens", label: "Label Lens", icon: Tag },
  { href: "/release-cohorts", label: "Release Cohorts", icon: Calendar },
  { href: "/library", label: "Library", icon: Heart },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex-1 lg:flex-initial">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group w-fit">
              <div className="relative h-7 w-7 sm:h-8 sm:w-8 transition-transform duration-300 group-hover:scale-110">
                <Image
                  src="/logo.png"
                  alt="Statify Logo"
                  width={32}
                  height={32}
                  className="h-full w-auto object-contain drop-shadow-md"
                />
              </div>
              <span className="font-bold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Statify
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {routes.map((route) => {
              const Icon = route.icon;
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "relative flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
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
                  <span>{route.label}</span>
                  {isActive && (
                    <div className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side - User actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{user.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden lg:flex gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/auth" className="hidden lg:block">
                <Button variant="default" size="sm">
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={cn(
          "fixed top-16 right-0 z-50 h-[calc(100vh-4rem)] w-64 bg-background border-l border-border shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-2 flex-1">
            {routes.map((route) => {
              const Icon = route.icon;
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    "hover:bg-accent/50 active:scale-95",
                    isActive
                      ? "text-foreground bg-accent shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  <span>{route.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile User Actions */}
          <div className="border-t border-border pt-4 space-y-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-accent/50">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className="w-full justify-start gap-3 px-4 py-3"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/auth" onClick={closeMobileMenu}>
                <Button variant="default" size="sm" className="w-full">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
