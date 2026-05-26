import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

/**
 * Strawford — Fedelo Studio's display face.
 * Loaded locally from /public/fonts so we keep the same cuts as the
 * fedelo.studio website. Five weights are enough for SaaS UI:
 * 300 (light), 400 (regular + italic), 500 (medium), 700 (bold).
 */
const strawford = localFont({
  src: [
    { path: "../../public/fonts/strawford-light-webfont.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/strawford-regular-webfont.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/strawford-regularitalic-webfont.woff2", weight: "400", style: "italic" },
    { path: "../../public/fonts/strawford-medium-webfont.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/strawford-bold-webfont.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-strawford",
  display: "swap",
  fallback: ["-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoloPilot — Cockpit business",
  description:
    "De la prospection à la trésorerie, sans perdre le fil. Cockpit business pour indépendants, freelances et studios créatifs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${strawford.variable} ${jetbrains.variable}`}
    >
      <body className="bg-background font-sans text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
