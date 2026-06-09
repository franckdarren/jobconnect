import Link from "next/link";
import { WifiOff } from "lucide-react";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-jc-primary-dark text-white px-6">
      <div className="max-w-sm text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 flex items-center justify-center">
          <WifiOff className="w-9 h-9 text-jc-primary-green" />
        </div>
        <h1 className="text-2xl font-bold">Vous êtes hors ligne</h1>
        <p className="text-sm text-white/70">
          JobConnect a besoin d&apos;une connexion pour afficher cette page.
          Vérifiez votre réseau et réessayez.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-jc-primary-green hover:bg-jc-primary-green/90 text-white font-semibold px-5 py-2.5 text-sm"
        >
          Réessayer
        </Link>
      </div>
    </div>
  );
}
