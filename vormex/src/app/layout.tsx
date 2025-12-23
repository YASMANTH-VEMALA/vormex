import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vormex - Student Community",
  description: "Privacy-first community platform for students",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vormex",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-black text-white`}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
