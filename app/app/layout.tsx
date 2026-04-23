import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Mia",
  description: "A dietitian in your pocket — answers 15 questions, cooks your week.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Mia",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icons/icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4a5228",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="mia-theme" strategy="beforeInteractive">
          {`try { const t = localStorage.getItem('mia-theme'); if (t === 'dark') document.documentElement.setAttribute('data-theme','dark'); } catch {}`}
        </Script>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
