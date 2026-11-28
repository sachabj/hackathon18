import type { Metadata, Viewport } from "next";
import ArrowFlight from "@/components/arrows/ArrowFlight";
import ArrowToast from "@/components/arrows/ArrowToast";
import LangSync from "@/components/LangSync";
import LaunchSplash from "@/components/LaunchSplash";
import LocationConsentDialog from "@/components/location/LocationConsentDialog";
import NearbyPrompt from "@/components/location/NearbyPrompt";
import Notifier from "@/components/notifications/Notifier";
import NavBar from "@/components/NavBar";
import RoleGate from "@/components/RoleGate";
import SupabaseBanner from "@/components/SupabaseBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShareWood — les bons plans étudiants",
  description: "Partage et découvre les bons plans étudiants autour de toi.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#faf9f5" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LaunchSplash />
        <SupabaseBanner />
        <main className="sw-main flex-1 flex flex-col pb-16">
          <RoleGate>{children}</RoleGate>
        </main>
        <NavBar />
        <ArrowToast />
        <ArrowFlight />
        <LocationConsentDialog />
        <LangSync />
        <NearbyPrompt />
        <Notifier />
      </body>
    </html>
  );
}
