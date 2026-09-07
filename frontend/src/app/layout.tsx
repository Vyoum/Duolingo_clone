import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { AppProviders } from "@/components/layout/AppProviders";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Duolingo Clone",
  description: "A Duolingo-style learning path and lesson player",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body className="min-h-full bg-[var(--duo-bg)] font-sans text-[var(--duo-text)] antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
