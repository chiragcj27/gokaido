"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import SearchModal, { type SearchModalProduct } from "../SearchModal/SearchModal";
import { useCart } from "../../lib/cartStore";
import styles from "./Navbar.module.css";

const navLinks = [
  { key: "best-sellers", href: "/best-sellers", label: "Best Sellers", src: "/navbar/best-sellers.png", width: 141, height: 41 },
  { key: "events", href: "/events", label: "Events", src: "/navbar/events.png", width: 95, height: 41 },
  { key: "our-franchise", href: "/our-franchise", label: "Our Franchise", src: "/navbar/our-franchise.png", width: 167, height: 41 },
  { key: "about-us", href: "/about-us", label: "About Us", src: "/navbar/about-us.png", width: 119, height: 41 },
  { key: "contact-us", href: "/contact-us", label: "Contact Us", src: "/navbar/contact-us.png", width: 140, height: 41 },
];

export interface NavCategory {
  key: string;
  label: string;
  href: string;
}

export interface NavbarProps {
  /** Active categories from the API (layout.tsx) — placeholders linking to /collections until real ones exist. */
  categories: NavCategory[];
  /** Search modal content, fetched server-side by the layout. */
  trendingSearches: string[];
  bestsellers: SearchModalProduct[];
}

export default function Navbar({ categories, trendingSearches, bestsellers }: NavbarProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const categoryRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { itemCount, lastAdded } = useCart();
  const cartIconRef = useRef<HTMLSpanElement>(null);
  // Sticky, but slides away while scrolling down and returns on any scroll up.
  // Mainly for the homepage hero: its reel morphs into a full-viewport card
  // painted on a fixed layer (Hero.tsx, z-20) that this header (z-40) would
  // otherwise permanently cover the top of. Hiding on scroll-down gives the
  // reel the whole screen exactly while the visitor is scrolling through it.
  const [hidden, setHidden] = useState(false);
  const menuOpen = categoryOpen || mobileOpen || searchOpen;

  useEffect(() => {
    if (menuOpen) {
      setHidden(false);
      return;
    }
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const delta = y - lastY;
      // Ignore tiny jitters (trackpad inertia, iOS rubber-banding) so it doesn't flicker.
      if (Math.abs(delta) < 6) return;
      lastY = y;
      const headerH = headerRef.current?.offsetHeight ?? 0;
      setHidden(delta > 0 && y > headerH);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  // Something was just added: bring the navbar back if it was scrolled away so the badge is
  // visible, and give the cart icon a "hit" wiggle.
  useEffect(() => {
    if (!lastAdded) return;
    setHidden(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cartIconRef.current?.animate(
      [
        { transform: "none" },
        { transform: "scale(1.18) rotate(-12deg)" },
        { transform: "scale(1.1) rotate(9deg)" },
        { transform: "scale(1.04) rotate(-4deg)" },
        { transform: "none" },
      ],
      { duration: 600, delay: 250, easing: "ease-out" },
    );
  }, [lastAdded]);

  // New page → always start with the navbar showing.
  useEffect(() => setHidden(false), [pathname]);

  // Keep --navbar-h (--navbar-offset is built from it) equal to the
  // real rendered height, rather than trusting the CSS fallback in globals.css.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--navbar-h", `${header.offsetHeight}px`);
    });
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  // Lets other sticky elements sit below the navbar only while it's showing.
  useEffect(() => {
    document.documentElement.style.setProperty("--navbar-offset", hidden ? "0px" : "var(--navbar-h)");
  }, [hidden]);

  useEffect(() => {
    if (!categoryOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!categoryRef.current?.contains(event.target as Node)) setCategoryOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCategoryOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [categoryOpen]);

  // Mobile menu is a full-screen panel: lock page scroll behind it, close on Escape,
  // and move focus to its close button so keyboard users land inside it.
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      menuToggleRef.current?.focus();
    };
  }, [mobileOpen]);

  // Navigating (including tapping the current page's link) closes the menu.
  useEffect(() => {
    setMobileOpen(false);
    setMobileCategoryOpen(false);
  }, [pathname]);

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileCategoryOpen(false);
  };
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header ref={headerRef} className={hidden ? `${styles.header} ${styles.headerHidden}` : styles.header}>
      <div className={styles.inner}>
        {/* First in the DOM so on mobile it sits at the left edge, opposite the icons. */}
        <button
          type="button"
          ref={menuToggleRef}
          className={styles.menuToggle}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={styles.left}>
          <Link href="/" className={styles.logoLink} aria-label="Gokaido home">
            <Image src="/navbar/logo.png" alt="Gokaido" width={256} height={87} className={styles.logo} priority />
          </Link>

          <nav className={styles.navLinks} aria-label="Primary">
            <div className={styles.categoryWrap} ref={categoryRef}>
              <button
                type="button"
                className={styles.categoryButton}
                aria-expanded={categoryOpen}
                aria-haspopup="true"
                onClick={() => setCategoryOpen((open) => !open)}
              >
                <Image
                  src="/navbar/category-text.png"
                  alt="Category"
                  width={108}
                  height={41}
                  className={styles.navText}
                />
                <Image
                  src="/navbar/category-chevron.png"
                  alt=""
                  width={20}
                  height={46}
                  className={categoryOpen ? `${styles.navText} ${styles.chevron} ${styles.chevronOpen}` : `${styles.navText} ${styles.chevron}`}
                />
              </button>
              {categoryOpen && (
                // Placeholder list until the category mega-menu Figma frame lands.
                <div className={styles.categoryMenu} role="menu">
                  {categories.map((category) => (
                    <Link
                      key={category.key}
                      href={category.href}
                      role="menuitem"
                      className={styles.categoryItem}
                      onClick={() => setCategoryOpen(false)}
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link key={link.key} href={link.href} className={styles.navImageLink}>
                <Image
                  src={link.src}
                  alt={link.label}
                  width={link.width}
                  height={link.height}
                  className={styles.navText}
                />
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Search"
            aria-haspopup="dialog"
            onClick={() => setSearchOpen(true)}
          >
            <Image src="/navbar/icon-search.png" alt="" width={37} height={56} className={styles.iconImg} />
          </button>
          <Link href="/account" className={styles.iconButton} aria-label="Account">
            <Image src="/navbar/icon-account.png" alt="" width={37} height={56} className={styles.iconImg} />
          </Link>
          <Link
            href="/cart"
            className={styles.iconButton}
            aria-label={itemCount > 0 ? `Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}` : "Cart"}
          >
            <span ref={cartIconRef} className={styles.cartIcon}>
              <Image src="/navbar/icon-cart.png" alt="" width={37} height={56} className={styles.iconImg} />
              {itemCount > 0 && (
                // Keyed by count so every change replays the pop.
                <span key={itemCount} className={styles.cartBadge} aria-hidden="true">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </span>
          </Link>
        </div>
      </div>
      <div
        id="mobile-menu"
        className={mobileOpen ? `${styles.drawer} ${styles.drawerOpen}` : styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <div className={styles.drawerHead}>
          <Link href="/" className={styles.logoLink} aria-label="Gokaido home" onClick={closeMobile}>
            <Image src="/navbar/logo.png" alt="Gokaido" width={256} height={87} className={styles.drawerLogo} />
          </Link>
          <button
            type="button"
            ref={closeButtonRef}
            className={styles.drawerClose}
            aria-label="Close menu"
            onClick={closeMobile}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className={styles.drawerNav} aria-label="Mobile">
          <Link
            href="/"
            className={isActive("/") ? `${styles.drawerRow} ${styles.drawerRowActive}` : styles.drawerRow}
            aria-current={isActive("/") ? "page" : undefined}
            style={stagger(0)}
            onClick={closeMobile}
          >
            <span>Home</span>
            <DrawerChevron />
          </Link>

          <button
            type="button"
            className={styles.drawerRow}
            aria-expanded={mobileCategoryOpen}
            aria-controls="mobile-menu-categories"
            style={stagger(1)}
            onClick={() => setMobileCategoryOpen((open) => !open)}
          >
            <span>Category</span>
            <DrawerChevron open={mobileCategoryOpen} />
          </button>
          <div
            id="mobile-menu-categories"
            className={mobileCategoryOpen ? `${styles.drawerSub} ${styles.drawerSubOpen}` : styles.drawerSub}
          >
            <div className={styles.drawerSubInner}>
              {categories.map((category) => (
                <Link key={category.key} href={category.href} className={styles.drawerSubItem} onClick={closeMobile}>
                  {category.label}
                </Link>
              ))}
            </div>
          </div>

          {navLinks.map((link, index) => (
            <Link
              key={link.key}
              href={link.href}
              className={isActive(link.href) ? `${styles.drawerRow} ${styles.drawerRowActive}` : styles.drawerRow}
              aria-current={isActive(link.href) ? "page" : undefined}
              style={stagger(index + 2)}
              onClick={closeMobile}
            >
              <span>{link.label}</span>
              <DrawerChevron />
            </Link>
          ))}
        </nav>

        <div className={styles.drawerFoot} style={stagger(navLinks.length + 2)}>
          <Link href="/account" className={styles.drawerFootButton} onClick={closeMobile}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            My Account
          </Link>
          <Link href="/account?tab=orders" className={styles.drawerFootButton} onClick={closeMobile}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M5 8h14l-1 13H6L5 8z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 10V6a3 3 0 0 1 6 0v4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            My Orders
          </Link>
        </div>
      </div>

      <SearchModal
        open={searchOpen}
        onClose={closeSearch}
        trendingSearches={trendingSearches}
        bestsellers={bestsellers}
      />
    </header>
  );
}

/** Entrance order for the mobile menu's staggered reveal (read as --i in the CSS). */
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

function DrawerChevron({ open = false }: { open?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      className={open ? `${styles.drawerChevron} ${styles.drawerChevronOpen}` : styles.drawerChevron}
    >
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
