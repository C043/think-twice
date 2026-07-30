import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import ThemedToaster from "@/components/ThemedToaster";
import { SettingsProvider } from "@/components/SettingsProvider";
import { readSettings } from "@/lib/read-settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  applicationName: "Think Twice",
  title: "Think Twice",
  description: "The solution to compulsive buying.",
  appleWebApp: {
    capable: true,
    title: "Think Twice",
    statusBarStyle: "black-translucent",
  },
  icons: {
    // Engines that support it get the vector mark. The 16/32/48/64 favicon.ico
    // fallback is not listed here: src/app/favicon.ico is a file convention, so
    // Next already emits a <link> for it and repeating it duplicates the tag.
    icon: { url: "/icons/icon.svg", type: "image/svg+xml" },
    apple: "/icons/apple-touch-icon.png",
  },
  other: {
    // Next emits the standardised `mobile-web-app-capable`; older iOS versions
    // still only look at the Apple-prefixed one.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
  ],
  viewportFit: "cover",
};

/**
 * Every page below this layout reads live rows: settings here, objects in the
 * list. A database query is not something Next treats as dynamic on its own, so
 * without this the pages get prerendered at build time and keep serving
 * whatever the database held then.
 */
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await readSettings();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SettingsProvider settings={settings}>
            {children}
            <ThemedToaster />
          </SettingsProvider>
        </ThemeProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
