"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/coupons", label: "Coupons" },
];

export default function Sidebar({
  userName,
  onLogout,
}: {
  userName?: string;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">Gokaido Admin</div>
      <ul className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={pathname === item.href ? "active" : ""}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        {userName && <div className="sidebar-user">{userName}</div>}
        <button type="button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
