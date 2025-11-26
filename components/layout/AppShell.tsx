"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Home,
  PlusCircle,
  Share2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/app/providers";
import { useAppwrite } from "@/app/appwrite-provider";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { masterPassCrypto } from "@/app/(protected)/masterpass/logic";
import { Navbar } from "./Navbar";
import { PasskeySetup } from "@/components/overlays/passkeySetup";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  // Overview removed from navigation
  // { name: "Overview", href: "/overview", icon: Monitor },
  { name: "Sharing", href: "/sharing", icon: Share2 },
  { name: "New", href: "/credentials/new", icon: PlusCircle, big: true },
  { name: "TOTP", href: "/totp", icon: Shield },
  { name: "Import", href: "/import", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings },
];

const SIMPLIFIED_LAYOUT_PATHS = [
  "/",
  "/masterpass",
  "/masterpass/reset",
  "/twofa/access",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, loading, logout, refresh } = useAppwrite();
  const router = useRouter();
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);

  const isSimplifiedLayout = SIMPLIFIED_LAYOUT_PATHS.includes(pathname);

  useEffect(() => {
    if (user && !loading) {
      // Check for passkey enforcement
      const shouldEnforce = 
        user.mustCreatePasskey || 
        (process.env.NEXT_PUBLIC_PASSKEY_ENFORCE === 'true' && !user.isPasskey);
      
      if (shouldEnforce && masterPassCrypto.isVaultUnlocked()) {
        setShowPasskeySetup(true);
      }
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !user && !isSimplifiedLayout) {
      router.replace("/masterpass");
    }
  }, [loading, user, isSimplifiedLayout, router]);

  useEffect(() => {
    if (user && !isSimplifiedLayout) {
      masterPassCrypto.updateActivity();

      // Set up global inactivity watcher
      let intervalId: number | undefined;
      const handleActivity = () => masterPassCrypto.updateActivity();

      const startWatcher = () => {
        clearInterval(intervalId as unknown as number);
        intervalId = window.setInterval(() => {
          if (!masterPassCrypto.isVaultUnlocked()) {
            sessionStorage.setItem("masterpass_return_to", pathname);
            router.replace("/masterpass");
            clearInterval(intervalId as unknown as number);
          }
        }, 1000);
      };

      // Active interactions we consider as activity
      window.addEventListener("mousemove", handleActivity);
      window.addEventListener("mousedown", handleActivity);
      window.addEventListener("keydown", handleActivity);
      window.addEventListener("scroll", handleActivity, { passive: true });
      window.addEventListener("touchstart", handleActivity, { passive: true });
      window.addEventListener("focus", handleActivity);
      window.addEventListener("click", handleActivity);

      // Also re-check on visibility changes
      const handleVisibility = () => {
        // if user returns and vault expired while hidden, redirect
        if (!masterPassCrypto.isVaultUnlocked()) {
          sessionStorage.setItem("masterpass_return_to", pathname);
          router.replace("/masterpass");
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);

      startWatcher();

      if (!masterPassCrypto.isVaultUnlocked()) {
        sessionStorage.setItem("masterpass_return_to", pathname);
        router.replace("/masterpass");
      }

      return () => {
        window.removeEventListener("mousemove", handleActivity);
        window.removeEventListener("mousedown", handleActivity);
        window.removeEventListener("keydown", handleActivity);
        window.removeEventListener("scroll", handleActivity);
        window.removeEventListener("touchstart", handleActivity);
        window.removeEventListener("focus", handleActivity);
        window.removeEventListener("click", handleActivity);
        document.removeEventListener("visibilitychange", handleVisibility);
        clearInterval(intervalId as unknown as number);
      };
    }
  }, [user, isSimplifiedLayout, pathname, router]);

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return Sun;
      case "dark":
        return Moon;
      default:
        return Monitor;
    }
  };

  const ThemeIcon = getThemeIcon();

  if (isSimplifiedLayout) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  if (!loading && !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Navbar />

      <div className="flex-1 flex w-full overflow-x-hidden pt-16">
        {/* Bottom bar (mobile only) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/100 border-t flex lg:hidden justify-around items-center h-16 shadow-lg safe-area-inset-bottom">
          {navigation
            .filter((item) => item.name !== "Import" && item.name !== "Overview")
            .map((item) => {
              const isActive = pathname === item.href;
              const isBig = item.big;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    "flex flex-col items-center justify-center p-2 min-w-0 flex-1",
                    isBig ? "scale-110" : "",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary",
                  )}
                  aria-label={item.name}
                >
                  <item.icon
                    className={clsx(
                      "mb-1 flex-shrink-0",
                      isBig ? "h-7 w-7" : "h-5 w-5",
                    )}
                  />
                  <span
                    className={clsx("text-xs truncate", isBig && "font-semibold")}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
        </nav>

        {user && (
          <PasskeySetup
            isOpen={showPasskeySetup}
            onClose={() => setShowPasskeySetup(false)}
            userId={user.$id}
            isEnabled={false}
            onSuccess={() => {
              setShowPasskeySetup(false);
              refresh();
            }}
            trustUnlocked={true}
          />
        )}
              >
                <Shield className="h-4 w-4" />
                Lock now
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content (offset for fixed sidebar) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden lg:ml-64">
          <main className="flex-1 px-2 py-4 sm:px-3 md:px-4 lg:px-4 pb-20 lg:pb-6 overflow-x-hidden max-w-full">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom bar (mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/100 border-t flex lg:hidden justify-around items-center h-16 shadow-lg safe-area-inset-bottom">
        {navigation
          .filter((item) => item.name !== "Import" && item.name !== "Overview")
          .map((item) => {
            const isActive = pathname === item.href;
            const isBig = item.big;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center p-2 min-w-0 flex-1",
                  isBig ? "scale-110" : "",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary",
                )}
                aria-label={item.name}
              >
                <item.icon

      {user && (
        <PasskeySetup
          isOpen={showPasskeySetup}
          onClose={() => setShowPasskeySetup(false)}
          userId={user.$id}
          isEnabled={false}
          onSuccess={() => {
            setShowPasskeySetup(false);
            refresh();
          }}
          trustUnlocked={true}
        />
      )}
                  className={clsx(
                    "mb-1 flex-shrink-0",
                    isBig ? "h-7 w-7" : "h-5 w-5",
                  )}
                />
                <span
                  className={clsx("text-xs truncate", isBig && "font-semibold")}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
