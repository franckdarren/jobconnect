import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/shared/PwaRegister";
import { InstallPwaBanner } from "@/components/shared/InstallPwaBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JobConnect — L'emploi direct au Gabon",
  description:
    "Trouvez un job en 48h au Gabon. Plateforme de recrutement WhatsApp-first.",
  applicationName: "JobConnect",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JobConnect",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1B2A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={cn("h-full", inter.variable)}>
      <body className="min-h-full bg-jc-background text-jc-text-primary antialiased font-sans">
        {children}
        <Toaster position="top-center" richColors />
        <PwaRegister />
        <InstallPwaBanner />
      </body>
    </html>
  );
}
