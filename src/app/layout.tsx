import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/shared/PwaRegister";
import { InstallPwaBanner } from "@/components/shared/InstallPwaBanner";
import { AppDataProvider } from "@/components/shared/AppDataProvider";

const inter = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "241Job — L'emploi direct au Gabon",
  description:
    "Trouvez un job en 48h au Gabon. Plateforme de recrutement WhatsApp-first.",
  applicationName: "241Job",
  icons: {
    icon: [
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "241Job",
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
    <html
      lang="fr"
      className={cn("h-full", inter.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-jc-background text-jc-text-primary antialiased font-sans">
        <AppDataProvider>
          {children}
          <Toaster position="top-center" richColors />
          <PwaRegister />
          <InstallPwaBanner />
        </AppDataProvider>
      </body>
    </html>
  );
}
