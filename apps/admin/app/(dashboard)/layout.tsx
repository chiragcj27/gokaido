"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return <div className="page-loading">Loading…</div>;
  }
  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="shell">
      <Sidebar
        userName={user?.name}
        onLogout={() => {
          logout();
          router.replace("/login");
        }}
      />
      <div className="shell-content">{children}</div>
    </div>
  );
}
