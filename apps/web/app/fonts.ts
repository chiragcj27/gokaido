import { Geist, Montserrat, Roboto } from "next/font/google";

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const roboto = Roboto({
  subsets: ["latin"],
  // 300/900 are for blog posts, where the admin editor offers Light → Black.
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

export const geist = Geist({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-geist",
  display: "swap",
});
