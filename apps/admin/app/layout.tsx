import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Montserrat, Roboto } from "next/font/google";
import { AuthProvider } from "../lib/auth";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

// The storefront's fonts, under the same CSS variables, so the blog editor canvas renders posts
// (which reference var(--font-montserrat) etc.) exactly as the site will. Only downloaded when used.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Gokaido Admin",
  description: "Internal admin portal for the Gokaido D2C store",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} ${montserrat.variable} ${roboto.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
