import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GhostMeter 👻 - Analyse ta conversation de crush",
  description: "Découvre si ton crush t'aime vraiment ! Analyse IA de tes conversations WhatsApp, Messenger, Instagram, Snapchat. Score d'intérêt, manipulation et ghosting en quelques secondes.",
  keywords: ["ghostmeter", "crush", "amour", "dating", "analyse conversation", "ghosting", "IA", "WhatsApp", "Messenger", "Instagram", "Snapchat", "TikTok viral"],
  authors: [{ name: "GhostMeter Team" }],
  icons: {
    icon: "/logo.svg",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GhostMeter",
  },
  openGraph: {
    title: "GhostMeter 👻 - Analyse ta conversation de crush",
    description: "Découvre si ton crush t'aime vraiment ! Analyse IA de tes conversations.",
    url: "https://ghostmeter.app",
    siteName: "GhostMeter",
    type: "website",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "GhostMeter Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GhostMeter 👻",
    description: "Découvre si ton crush t'aime vraiment !",
    images: ["/icons/icon-512x512.png"],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#a855f7" },
    { media: "(prefers-color-scheme: dark)", color: "#7c3aed" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('GhostMeter SW registered: ', registration.scope);
                    },
                    function(err) {
                      console.log('GhostMeter SW registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
