"use client";

// /account — opened from the navbar's person icon. Shows Login / Sign Up for
// guests and My Account (sidebar + tabs) once signed in. The active tab lives
// in `?tab=` so it survives reloads and can be deep-linked (e.g. ?tab=orders).
// A guest who arrives with `?next=` (set by the navbar's account icon) is sent
// back to that page as soon as they log in or sign up.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth/authStore";
import { OverviewTab, SettingsTab } from "./AccountTabs";
import OrderDetail from "./OrderDetail";
import OrdersTab from "./OrdersTab";
import WishlistTab from "./WishlistTab";
import AddressesTab from "./AddressesTab";
import LoginSignup from "./LoginSignup";
import ProfileTab from "./ProfileTab";

const TABS = [
  { id: "overview", label: "Overview", heading: "My Account" },
  { id: "orders", label: "Orders", heading: "My Orders" },
  { id: "wishlist", label: "Wishlist", heading: "My Wishlist" },
  { id: "addresses", label: "Addresses", heading: "My Addresses" },
  { id: "profile", label: "Profile", heading: "My Profile" },
  // Not in the Figma sidebar, but language + notification preferences are a Phase 1 requirement.
  { id: "settings", label: "Settings", heading: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-heading text-xs font-bold tracking-[0.08em] text-red uppercase sm:text-sm">Account</span>
      <h1 className="m-0 font-heading text-4xl leading-none font-bold text-paper uppercase sm:text-5xl 2xl:text-[4rem]">{title}</h1>
      <p className="m-0 font-heading text-sm text-paper/80 sm:text-lg 2xl:text-xl">{subtitle}</p>
    </div>
  );
}

// Figma sidebar: #070707 rail with #0f0f0f buttons, a red border marking the active one.
const navItemClass =
  "w-full rounded border bg-[#0f0f0f] px-5 py-3 text-center font-sans text-sm whitespace-nowrap text-paper transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-base lg:py-4 2xl:py-4.5 2xl:text-lg";

function MyAccount() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { logout } = useAuth();
  const requested = params.get("tab");
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : "profile";
  const orderId = tab === "orders" ? params.get("order") : null;
  const heading = TABS.find((t) => t.id === tab)!.heading;

  const go = (id: TabId) => router.replace(`${pathname}?tab=${id}`, { scroll: false });
  const openOrder = (id: string | null) =>
    router.push(id ? `${pathname}?tab=orders&order=${id}` : `${pathname}?tab=orders`, { scroll: false });

  return (
    <>
      <PageHeading title={heading} subtitle="Manage your profile, orders and preferences." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr] lg:gap-6 2xl:grid-cols-[18.5rem_1fr] 2xl:gap-8">
        <nav
          aria-label="Account sections"
          className="rounded-md border border-[#2e2e2e] bg-[#070707] p-1.5"
        >
          <ul className="m-0 flex list-none gap-1.5 overflow-x-auto p-0 lg:flex-col">
            {TABS.map((t) => (
              <li key={t.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => go(t.id)}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={`${navItemClass} ${tab === t.id ? "border-[#f21b1b]" : "border-[#2e2e2e] hover:border-white/30"}`}
                >
                  {t.label}
                </button>
              </li>
            ))}
            <li className="shrink-0">
              <button type="button" onClick={logout} className={`${navItemClass} border-[#2e2e2e] hover:border-white/30`}>
                Log Out
              </button>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">
          {tab === "overview" && <OverviewTab onShowOrders={() => go("orders")} />}
          {tab === "orders" &&
            (orderId ? <OrderDetail orderId={orderId} onBack={() => openOrder(null)} /> : <OrdersTab onOpenOrder={openOrder} />)}
          {tab === "wishlist" && <WishlistTab />}
          {tab === "addresses" && <AddressesTab />}
          {tab === "profile" && <ProfileTab onEditAddresses={() => go("addresses")} />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </div>
    </>
  );
}

/** Only same-site paths — `//evil.com` or an absolute URL would make this an open redirect. */
function safeReturnPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  if (next.startsWith("/account")) return null;
  return next;
}

export default function AccountPageClient() {
  const { status } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = safeReturnPath(params.get("next"));

  // Redirect only on the guest → authenticated transition (i.e. they just logged in here),
  // not when an already signed-in customer opens a stale ?next= link.
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current === "guest" && status === "authenticated" && returnTo) router.replace(returnTo);
    prevStatus.current = status;
  }, [status, returnTo, router]);

  return (
    <main className="mx-auto flex max-w-[1600px] flex-col gap-5 px-4 pt-[calc(var(--navbar-h)+0.25rem)] pb-24 sm:px-6 lg:px-12.5 lg:pt-[calc(var(--navbar-h)+0.5rem)]">
      {status === "loading" ? (
        <p className="m-0 py-24 text-center font-sans text-sm text-paper/40">Loading…</p>
      ) : status === "guest" ? (
        <>
          <PageHeading
            title="Login / Sign Up"
            subtitle={
              returnTo?.startsWith("/checkout")
                ? "Log in or create a GOKAIDO account to continue to checkout. Your bag is saved."
                : "Sign in to your account or create a new GOKAIDO account."
            }
          />
          <LoginSignup />
        </>
      ) : status === "authenticated" && returnTo && prevStatus.current === "guest" ? (
        <p className="m-0 py-24 text-center font-sans text-sm text-paper/40">Signed in — taking you back…</p>
      ) : (
        <MyAccount />
      )}
    </main>
  );
}
