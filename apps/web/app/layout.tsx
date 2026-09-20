import type { Metadata } from "next";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import SiteFooter from "./components/Footer/SiteFooter";
import { CartProvider } from "./lib/cartStore";
import { geist, montserrat, roboto } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  // Base for every relative canonical / Open Graph URL in page metadata.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Gokaido",
  description: "Gokaido app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${roboto.variable} ${geist.variable}`}>
      <body className="bg-ink font-sans text-paper antialiased">
        <CartProvider>
          <Navbar />
          {children}
          <SiteFooter>
            <Footer />
          </SiteFooter>
        </CartProvider>
      </body>
    </html>
  );
}
