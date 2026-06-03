import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConfirmPage() {
  return (
    <div className="w-full bg-white rounded-3xl shadow-sm p-8 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-jc-light-green flex items-center justify-center mb-4">
        <MailCheck className="w-7 h-7 text-jc-primary-green" />
      </div>
      <h1 className="text-2xl font-bold">Vérifiez votre boîte mail</h1>
      <p className="text-sm text-jc-text-secondary mt-2 max-w-xs">
        Nous vous avons envoyé un lien de confirmation. Cliquez dessus depuis votre
        téléphone, puis revenez vous connecter.
      </p>
      <Button
        asChild
        className="mt-6 w-full h-12 bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white font-semibold rounded-xl"
      >
        <Link href="/login">J&apos;ai confirmé, me connecter</Link>
      </Button>
      <p className="mt-4 text-xs text-jc-text-secondary">
        Vous n&apos;avez pas reçu le mail ? Vérifiez vos spams.
      </p>
    </div>
  );
}
