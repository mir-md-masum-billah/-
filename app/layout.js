import "./globals.css";
import { Hind_Siliguri, Tiro_Bangla } from "next/font/google";
import { createHash } from "node:crypto";
import { school } from "@/lib/school";
import { getSite } from "@/lib/site";
import { getLang } from "@/lib/lang";
import { LangProvider } from "@/components/LangProvider";
import Splash from "@/components/Splash";
import DialogHost from "@/components/Dialog";

const body = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-bn", display: "swap" });
// শিরোনামের জন্য ক্লাসিক বাংলা সেরিফ — একটাই ওজন, তাই ফন্ট ফাইল হালকা
const display = Tiro_Bangla({ subsets: ["bengali", "latin"], weight: "400", variable: "--font-display", display: "swap" });

export async function generateMetadata() {
  const lang = await getLang();
  const s = await getSite(lang);
  // লোগো বদলালে ?v= বদলে যায়, তাই ব্রাউজারের পুরোনো ফেভিকন আটকে থাকে না
  const v = s.logo ? createHash("md5").update(s.logo).digest("hex").slice(0, 8) : "0";
  const icon = `/favicon?v=${v}`;
  return { title: { default: s.name, template: `%s · ${s.name}` }, description: s.tagline, icons: { icon, shortcut: icon, apple: icon } };
}
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#04261E" };

// লোডিং স্ক্রিন একই সেশনে দ্বিতীয়বার দেখাতে না চাইলে এই স্ক্রিপ্ট থাকবে; প্রতিবার দেখাতে চাইলে স্ক্রিপ্টটি মুছে দিন
// একই স্ক্রিপ্টে সংরক্ষিত থিম (লাইট/ডার্ক) পেইন্টের আগেই বসে, তাই ঝিলিক দেয় না; সংরক্ষিত না থাকলে ডিভাইসের সেটিং অনুসরণ করে
const skipSplash = `try{var d=document.documentElement,t=localStorage.getItem("theme");if(t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches)d.classList.add("dark");if(sessionStorage.getItem("splash"))d.classList.add("no-splash")}catch(e){}`;

export default async function RootLayout({ children }) {
  const lang = await getLang();
  const site = await getSite(lang);
  return (
    <html lang={lang === "en" ? "en" : "bn"} className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: skipSplash }} /></head>
      <body className="font-sans">
        <LangProvider lang={lang}>
          <Splash name={site.name || school.name} tagline={site.tagline} logo={site.logo} />
          {children}
          <DialogHost />
        </LangProvider>
      </body>
    </html>
  );
}
