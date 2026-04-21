"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";
import { LayoutProvider } from "./LayoutContext";
import { Footer } from "@/components/footer/Footer";
import { SessionExpiryModal } from "./SessionExpiryModal";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authChecked, sessionWarning, sessionExpiresAt, extendSession, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPage = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    if (!authChecked) return;
    if (!isAuthenticated && !isPublicPage) {
      router.replace("/login");
    }
    if (isAuthenticated && isPublicPage) {
      router.replace("/");
    }
  }, [isAuthenticated, authChecked, isPublicPage, router]);

  // While checking stored session, render nothing to avoid flash
  if (!authChecked) return null;

  // Public pages (login / signup): render with no sidebar/header
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Not authenticated yet: will redirect, show nothing
  if (!isAuthenticated) return null;

  // Authenticated: full app shell
  return (
    <LayoutProvider>
      {sessionWarning && (
        <SessionExpiryModal expiresAt={sessionExpiresAt} onExtend={extendSession} onLogout={logout} />
      )}
      <Sidebar />
      <main className="ml-0 md:ml-20 h-screen flex flex-col" style={{ backgroundColor: "#f3f3f3" }}>
        <AppHeader />
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-20 md:px-6 md:pt-4 md:pb-6">{children}</div>
      </main>
      <Footer />
    </LayoutProvider>
  );
}