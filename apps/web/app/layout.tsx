import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { themeInitScript } from "@/lib/theme-script";
import { Providers } from "@/components/Providers";
import "@/styles/globals.css";

const displayFont = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nova AI — Your Thinking, Refined.",
  description:
    "Nova AI is a premium AI workspace for conversation, creation, research, analysis and intelligent tools.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Nova AI — Your Thinking, Refined.",
    description:
      "Nova AI is a premium AI workspace for conversation, creation, research, analysis and intelligent tools.",
    siteName: "Nova AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nova AI — Your Thinking, Refined.",
    description:
      "Nova AI is a premium AI workspace for conversation, creation, research, analysis and intelligent tools.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${displayFont.variable} ${bodyFont.variable}`}>
      <head>
        {/* Blocking script prevents a flash of the wrong theme before hydration. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
