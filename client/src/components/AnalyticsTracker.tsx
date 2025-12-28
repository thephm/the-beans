"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Skip tracking while auth state is loading or if current user is an admin
    if (loading) return;
    if (user && user.role === 'admin') return;

    if (typeof window !== "undefined") {
      apiClient.trackEvent("page_view", { path: pathname });
    }
  }, [pathname, user, loading]);
  return null;
}
