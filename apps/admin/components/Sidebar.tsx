"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { AttentionCounts } from "../lib/types";

interface NavItem {
  href: string;
  label: string;
  badge?: (c: AttentionCounts) => number;
}

const NAV_GROUPS: { title?: string; items: NavItem[] }[] = [
  { items: [{ href: "/", label: "Dashboard" }] },
  {
    title: "Sales",
    items: [
      { href: "/orders", label: "Orders", badge: (c) => c.toShip + c.refundsPending },
      { href: "/customers", label: "Customers" },
      { href: "/coupons", label: "Coupons" },
      { href: "/reviews", label: "Reviews", badge: (c) => c.pendingReviews },
      { href: "/franchise-enquiries", label: "Franchise enquiries", badge: (c) => c.newEnquiries },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/products", label: "Products" },
      { href: "/categories", label: "Categories" },
      { href: "/subcategories", label: "Subcategories" },
      { href: "/colors", label: "Colors" },
      { href: "/bestsellers", label: "Bestsellers" },
    ],
  },
  {
    title: "Site content",
    items: [
      { href: "/homepage", label: "Homepage" },
      { href: "/reels", label: "Reels" },
      { href: "/stores", label: "Stores" },
      { href: "/assets", label: "Asset store" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({
  userName,
  onLogout,
}: {
  userName?: string;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<AttentionCounts | null>(null);

  // Refreshed on every navigation so badges drop as soon as work is done.
  useEffect(() => {
    api
      .get<AttentionCounts>("/api/admin/dashboard/attention")
      .then(setCounts)
      .catch(() => {});
  }, [pathname]);

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">Gokaido Admin</div>
      <div className="sidebar-groups">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.title ?? i} className="sidebar-group">
            {group.title && <div className="sidebar-group-title">{group.title}</div>}
            <ul className="sidebar-nav">
              {group.items.map((item) => {
                const badge = counts && item.badge ? item.badge(counts) : 0;
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={isActive(pathname, item.href) ? "active" : ""}>
                      <span>{item.label}</span>
                      {badge > 0 && <span className="nav-badge">{badge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        {userName && <div className="sidebar-user">{userName}</div>}
        <button type="button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
