import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const siteUrl = "https://wafyorbit.vercel.app";
const siteTitle = "Wafy Orbit | Official Institutional & Academic Sphere Portal";
const siteDescription =
  "Official institutional digital ecosystem connecting academic orbits, affiliated colleges, district leaders, constituency delegations, and enrolled scholars under the Wafy Institution.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Wafy Orbit",
  },
  description: siteDescription,
  applicationName: "Wafy Orbit",
  keywords: [
    "Wafy Orbit",
    "Wafy",
    "Wafy Institution",
    "Wafy Portal",
    "CIC Wafy",
    "Coordination of Islamic Colleges",
    "Orbit Directory",
    "Wafy Students",
    "Orbit Leaders",
    "District Leaders",
    "Constituency Leaders",
    "Wafy Colleges",
    "Kerala Wafy Orbit",
    "wafyorbit",
    "wafyorbit.vercel.app",
  ],
  authors: [
    {
      name: "Wafy Orbit Central Administration",
      url: siteUrl,
    },
  ],
  creator: "Wafy Orbit Administration",
  publisher: "Coordination of Islamic Colleges (CIC)",
  category: "Education & Institutional Governance",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/orbitlogo.png", type: "image/png" },
      { url: "/icon1.png", type: "image/png" },
    ],
    shortcut: "/orbitlogo.png",
    apple: [
      { url: "/orbitlogo.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Wafy Orbit",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/orbitlogo.png`,
        width: 1200,
        height: 1200,
        alt: "Wafy Orbit Institutional Portal Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [`${siteUrl}/orbitlogo.png`],
    creator: "@WafyOrbit",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Wafy Orbit",
        description: siteDescription,
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
      },
      {
        "@type": "EducationalOrganization",
        "@id": `${siteUrl}/#organization`,
        name: "Wafy Orbit",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/orbitlogo.png`,
          width: "512",
          height: "512",
        },
        description: siteDescription,
        sameAs: [siteUrl],
      },
    ],
  };

  return (
    <html lang="en" className="h-full scroll-smooth">
    <meta name="google-site-verification" content="MpBGQlMKueFSZrBqMP8QKv2JsvSMxBQ-i0jhjLZI1VI" />
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} font-sans min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
