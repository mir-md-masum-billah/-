import "./globals.css";
import { Hind_Siliguri } from "next/font/google";
import { school } from "@/lib/school";

const font = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-bn", display: "swap" });

export const metadata = { title: `${school.name}`, description: school.tagline };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={font.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
