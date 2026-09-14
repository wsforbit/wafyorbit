import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Wafy Orbit | Excellence in Academic & Institutional Spheres",
  description:
    "Official portal for Wafy Orbit - interconnecting orbits, affiliated colleges, leaders, and students with real-time analytics and management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} font-sans min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
