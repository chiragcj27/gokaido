"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import SearchModal from "../SearchModal/SearchModal";
import styles from "./Navbar.module.css";

const navLinks = [
  { key: "best-sellers", href: "/best-sellers", label: "Best Sellers", src: "/navbar/best-sellers.png", width: 157, height: 46 },
  { key: "events", href: "/events", label: "Events", src: "/navbar/events.png", width: 106, height: 46 },
  { key: "our-franchise", href: "/our-franchise", label: "Our Franchise", src: "/navbar/our-franchise.png", width: 186, height: 46 },
  { key: "about-us", href: "/about-us", label: "About Us", src: "/navbar/about-us.png", width: 132, height: 46 },
  { key: "contact-us", href: "/contact-us", label: "Contact Us", src: "/navbar/contact-us.png", width: 156, height: 46 },
];

// Every category opens the sample collections page until the real ones are wired up.
const categories = [
  { key: "karate", label: "Karate", href: "/collections" },
  { key: "boxing", label: "Boxing", href: "/collections" },
  { key: "taekwondo", label: "Taekwondo", href: "/collections" },
];

export default function Navbar() {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const categoryRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.logoLink} aria-label="Gokaido home">
            <Image src="/navbar/logo.png" alt="Gokaido" width={256} height={87} className={styles.logo} priority />
          </Link>

          <nav
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
                  width={120}
                  height={45}
                  style={{ width: 120, height: 45 }}
                />
                <Image
                  src="/navbar/category-chevron.png"
                  alt=""
                  width={20}
                  height={46}
                  style={{ width: 20, height: 46 }}
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
            <Image src="/navbar/icon-search.png" alt="" width={37} height={56} style={{ width: 37, height: 56 }} />
          </button>
          <Link href="/account" className={styles.iconButton} aria-label="Account">
            <Image src="/navbar/icon-account.png" alt="" width={37} height={56} style={{ width: 37, height: 56 }} />
          </Link>
          <Link href="/cart" className={styles.iconButton} aria-label="Cart">
            <Image src="/navbar/icon-cart.png" alt="" width={37} height={56} style={{ width: 37, height: 56 }} />
          </Link>

          <button
            type="button"
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
      <SearchModal open={searchOpen} onClose={closeSearch} />
    </header>
  );
}
