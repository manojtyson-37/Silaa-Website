import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "SILA Collective — Effortless Style, Everyday Comfort",
  description:
    "Curated women's and kids' fashion — dresses, co-ord sets, and mom & girl twinning combos. Quality you can feel, delivered across India with COD.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} grain`}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
