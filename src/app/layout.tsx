import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GhostMeter 👻 - Analyse tes conversations avec l'IA",
  description: "Analyse IA de tes conversations WhatsApp, Messenger, Instagram, Snapchat. Score d'intérêt, détection de ghosting et manipulation en quelques secondes.",
  keywords: ["ghostmeter", "analyse conversation", "ghosting", "IA", "intelligence artificielle", "WhatsApp", "Messenger", "Instagram", "Snapchat", "analyse message"],
  authors: [{ name: "GhostMeter Team" }],
  icons: {
    icon: "/logo-square.png",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GhostMeter",
  },
  openGraph: {
    title: "GhostMeter 👻 - Analyse tes conversations avec l'IA",
    description: "Analyse IA de tes conversations. Décryptez le sens caché de vos échanges.",
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
    title: "GhostMeter 👻 - Analyse tes conversations",
    description: "Analyse IA de tes conversations avec l'intelligence artificielle.",
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
              // APK detection - MUST be simple and reliable
              (function() {
                var ua = navigator.userAgent;
                console.log('GhostMeter UA:', ua);
                
                // Check URL parameter first (most reliable)
                var urlParams = new URLSearchParams(window.location.search);
                var fromAPK = urlParams.get('from') === 'apk';
                
                if (fromAPK) {
                  console.log('✅ GhostMeter: from=apk detected in URL');
                  window.__GHOSTMETER_APK__ = true;
                  try { localStorage.setItem('ghostmeter_apk_mode', 'true'); } catch(e) {}
                } else {
                  // Check localStorage (already detected before)
                  try {
                    if (localStorage.getItem('ghostmeter_apk_mode') === 'true') {
                      console.log('✅ GhostMeter: APK mode from localStorage');
                      window.__GHOSTMETER_APK__ = true;
                    }
                  } catch(e) {}
                  
                  // Check User Agent for WebView indicators
                  if (!window.__GHOSTMETER_APK__) {
                    var isAndroid = /Android/i.test(ua);
                    var hasWv = ua.indexOf('wv') > -1;
                    var hasWebView = ua.indexOf('WebView') > -1;
                    var hasVersion = /Version\\/\\d/i.test(ua);
                    
                    if (isAndroid && (hasWv || hasWebView || hasVersion)) {
                      console.log('✅ GhostMeter: APK detected via UA');
                      window.__GHOSTMETER_APK__ = true;
                      try { localStorage.setItem('ghostmeter_apk_mode', 'true'); } catch(e) {}
                    }
                  }
                }
                
                // IMPORTANT: Push initial history state IMMEDIATELY for back button to work
                // This must be done before any user interaction
                if (window.__GHOSTMETER_APK__) {
                  console.log('Pushing initial history state for APK back button');
                  window.history.pushState({ ghostmeter: 'init' }, '', window.location.href);
                }
              })();
              
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
      </body>
    </html>
  );
}