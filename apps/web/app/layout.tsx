import type { Metadata } from "next";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import { geist, montserrat, roboto } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
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
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
