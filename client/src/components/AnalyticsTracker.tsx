"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { apiClient } from "@/lib/api";

export function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof window !== "undefined") {
      apiClient.trackEvent("page_view", { path: pathname });
    }
  }, [pathname]);
  return null;
}
