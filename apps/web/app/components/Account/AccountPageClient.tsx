"use client";

// /account — opened from the navbar's person icon. Shows Login / Sign Up for
// guests and My Account (sidebar + tabs) once signed in. The active tab lives
// in `?tab=` so it survives reloads and can be deep-linked (e.g. ?tab=orders).

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/auth/authStore";
import { OrdersTab, OverviewTab, SettingsTab, WishlistTab } from "./AccountTabs";
import AddressesTab from "./AddressesTab";
import LoginSignup from "./LoginSignup";
import ProfileTab from "./ProfileTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Orders" },
  { id: "wishlist", label: "Wishlist" },
  { id: "addresses", label: "Addresses" },
  { id: "profile", label: "Profile" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-heading text-xs font-bold tracking-[0.08em] text-red uppercase">Account</span>
      <h1 className="m-0 font-heading text-3xl font-extrabold text-paper uppercase sm:text-4xl">{title}</h1>
      <p className="m-0 font-sans text-sm text-paper/50">{subtitle}</p>
    </div>
  );
}

function MyAccount() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get("tab");
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : "profile";

  const go = (id: TabId) => router.replace(`${pathname}?tab=${id}`, { scroll: false });

  return (
    <>
      <PageHeading title="My Account" subtitle="Manage your profile, orders and preferences." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[12rem_1fr]">
        <nav aria-label="Account sections" className="rounded-lg border border-white/10 bg-panel p-2 lg:self-stretch">
          <ul className="m-0 flex list-none gap-2 overflow-x-auto p-0 lg:flex-col">
            {TABS.map((t) => (
              <li key={t.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => go(t.id)}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={`w-full rounded-md border px-4 py-2 font-sans text-xs transition-colors ${
                    tab === t.id
                      ? "border-red text-paper"
                      : "border-white/10 text-paper/70 hover:border-white/30 hover:text-paper"
                  }`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          {tab === "overview" && <OverviewTab onShowOrders={() => go("orders")} />}
          {tab === "orders" && <OrdersTab />}
          {tab === "wishlist" && <WishlistTab />}
          {tab === "addresses" && <AddressesTab />}
          {tab === "profile" && <ProfileTab onEditAddresses={() => go("addresses")} />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </div>
    </>
  );
}

export default function AccountPageClient() {
  const { status } = useAuth();

  return (
    <main className="mx-auto flex max-w-360 flex-col gap-6 px-4 pt-8 pb-24 sm:px-6 lg:px-8">
      {status === "loading" ? (
        <p className="m-0 py-24 text-center font-sans text-sm text-paper/40">Loading…</p>
      ) : status === "guest" ? (
        <>
          <PageHeading title="Login / Sign Up" subtitle="Sign in to your account or create a new GOKAIDO account." />
          <LoginSignup />
        </>
      ) : (
        <MyAccount />
      )}
    </main>
  );
}
