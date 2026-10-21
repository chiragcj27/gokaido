import type { Metadata } from "next";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import SiteFooter from "./components/Footer/SiteFooter";
import CartToast from "./components/CartToast/CartToast";
import { CartProvider } from "./lib/cartStore";
import { AuthProvider } from "./lib/auth/authStore";
import { getBestsellers, getCategories } from "./lib/catalog";
import { getTrendingSearches } from "./lib/homepage";
import { geist, montserrat, roboto } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  // Base for every relative canonical / Open Graph URL in page metadata.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Gokaido",
  description: "Gokaido app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Navbar data — each falls back to placeholders (lib/fallbacks.ts) if the API is down or empty.
  const [categories, trendingSearches, bestsellers] = await Promise.all([
    getCategories(),
    getTrendingSearches(),
    getBestsellers(4),
  ]);

  return (
    <html lang="en" className={`${montserrat.variable} ${roboto.variable} ${geist.variable}`}>
      <body className="bg-ink font-sans text-paper antialiased">
        <AuthProvider>
          <CartProvider>
            <Navbar
              categories={categories.map((c) => ({ key: c.slug, label: c.name, href: c.href }))}
              trendingSearches={trendingSearches}
              bestsellers={bestsellers.products}
            />
            {children}
            <CartToast />
            <SiteFooter>
              <Footer />
            </SiteFooter>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
