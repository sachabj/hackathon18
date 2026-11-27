import type { Metadata, Viewport } from "next";
import ArrowToast from "@/components/arrows/ArrowToast";
import LocationConsentDialog from "@/components/location/LocationConsentDialog";
import NavBar from "@/components/NavBar";
import RoleGate from "@/components/RoleGate";
import SupabaseBanner from "@/components/SupabaseBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShareWood — les bons plans étudiants",
  description: "Partage et découvre les bons plans étudiants autour de toi.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2563eb" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SupabaseBanner />
        <main className="sw-main flex-1 flex flex-col pb-16">
          <RoleGate>{children}</RoleGate>
        </main>
        <NavBar />
        <ArrowToast />
        <LocationConsentDialog />
      </body>
    </html>
  );
}
