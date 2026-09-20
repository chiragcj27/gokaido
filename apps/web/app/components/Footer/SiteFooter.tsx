"use client";

import { usePathname } from "next/navigation";

/** Global footer slot. Collection pages scroll inside their own pane and render the footer at the end of it. */
export default function SiteFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/collections")) return null;
  return <>{children}</>;
}
