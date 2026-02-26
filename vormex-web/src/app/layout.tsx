import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth/authContext";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { NotificationToastProvider } from "@/components/notifications/NotificationToast";
import { VormexDock } from "@/components/ui/dock";
import { AgentProvider } from "@/components/agent/AgentContext";
import EngagementProvider from "@/components/engagement/EngagementProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.vormex.in');

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Vormex',
  description: "India's professional networking platform for students",
  url: baseUrl,
  applicationCategory: 'SocialNetworkingApplication',
  operatingSystem: 'Web, Android, iOS',
  offers: { '@type': 'Offer', price: '0' },
  author: {
    '@type': 'Person',
    name: 'Yasmanth Vemala',
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Vormex – Professional Social Networking for Students',
    template: '%s | Vormex',
  },
  description:
    "Vormex is India's professional networking platform built for students. Showcase your skills, connect with peers & mentors, and build your career from Day 1.",
  keywords: [
    'student networking',
    'professional network India',
    'student community',
    'college network',
    'Vormex',
    'career',
    'connections',
  ],
  authors: [{ name: 'Yasmanth Vemala', url: baseUrl }],
  creator: 'Vormex',
  openGraph: {
    title: 'Vormex – Professional Social Networking for Students',
    description: "India's student professional network. Build skills, connect with peers.",
    url: baseUrl,
    siteName: 'Vormex',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Vormex Logo' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vormex',
    description: "India's student professional network.",
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/logo.png" sizes="180x180" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <AuthProvider>
              <NotificationToastProvider>
                <AgentProvider>
                  <EngagementProvider>
                    {children}
                  </EngagementProvider>
                  <VormexDock />
                </AgentProvider>
              </NotificationToastProvider>
            </AuthProvider>
            </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
