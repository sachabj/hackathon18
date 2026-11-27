import type { Metadata, Viewport } from "next";
import NavBar from "@/components/NavBar";
import SupabaseBanner from "@/components/SupabaseBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waze-Etu — les bons plans étudiants",
  description: "Signale et découvre les bons plans étudiants autour de toi.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2563eb" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SupabaseBanner />
        <main className="flex-1 flex flex-col pb-16">{children}</main>
        <NavBar />
      </body>
    </html>
  );
}
