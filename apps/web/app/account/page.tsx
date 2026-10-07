import type { Metadata } from "next";
import { Suspense } from "react";
import AccountPageClient from "../components/Account/AccountPageClient";

export const metadata: Metadata = {
  title: "My Account | Gokaido",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  // Suspense: AccountPageClient reads `?tab=` via useSearchParams.
  return (
    <Suspense>
      <AccountPageClient />
    </Suspense>
  );
}
