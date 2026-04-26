import type { Metadata } from "next";
import { Inter, PT_Serif, Urbanist } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Athena · The platform for financial advisers",
  description:
    "Practice management, execution and custody for the next " +
    "generation of financial advisers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={[inter.variable, ptSerif.variable, urbanist.variable, "antialiased"].join(" ")}
    >
      <body className="bg-background text-foreground min-h-screen">{children}</body>
    </html>
  );
}
