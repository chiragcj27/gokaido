"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import SearchModal, { type SearchModalProduct } from "../SearchModal/SearchModal";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const categoryRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
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

  // New page → always start with the navbar showing.
  useEffect(() => setHidden(false), [pathname]);

  // Keep --navbar-h (the hero sizes itself to 100svh minus it) equal to the
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

  // Mobile menu: close on a tap outside the panel (the toggle handles its own clicks).
  useEffect(() => {
    if (!mobileOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (navRef.current?.contains(target) || menuToggleRef.current?.contains(target)) return;
      setMobileOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <header ref={headerRef} className={hidden ? `${styles.header} ${styles.headerHidden}` : styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.logoLink} aria-label="Gokaido home">
            <Image src="/navbar/logo.png" alt="Gokaido" width={256} height={87} className={styles.logo} priority />
          </Link>

          <nav
            ref={navRef}
            className={mobileOpen ? `${styles.navLinks} ${styles.navLinksOpen}` : styles.navLinks}
            aria-label="Primary"
          >
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
                  style={{ width: 108, height: 41 }}
                />
                <Image
                  src="/navbar/category-chevron.png"
                  alt=""
                  width={20}
                  height={46}
                  style={{ width: 18, height: 41 }}
                  className={categoryOpen ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron}
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
                      onClick={() => {
                        setCategoryOpen(false);
                        setMobileOpen(false);
                      }}
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
                  style={{ width: link.width, height: link.height }}
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
            <Image src="/navbar/icon-search.png" alt="" width={37} height={56} style={{ width: 29, height: 43 }} />
          </button>
          <Link href="/account" className={styles.iconButton} aria-label="Account">
            <Image src="/navbar/icon-account.png" alt="" width={37} height={56} style={{ width: 29, height: 43 }} />
          </Link>
          <Link href="/cart" className={styles.iconButton} aria-label="Cart">
            <Image src="/navbar/icon-cart.png" alt="" width={37} height={56} style={{ width: 29, height: 43 }} />
          </Link>

          <button
            type="button"
            ref={menuToggleRef}
            className={styles.menuToggle}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
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
