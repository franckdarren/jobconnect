import Link from "next/link";
import { AuthCard } from "@/components/shared/AuthCard";
import { RegisterEmployerForm } from "./register-form";

export default function RegisterEmployerPage() {
  return (
    <AuthCard
      title="Trouver un partenaire de travail en quelques clics"
      subtitle="Recolter les profils les plus atypique pour votre entreprise"
      footer={
        <>
          En cliquant sur &laquo; Créer mon profil &raquo;, vous acceptez nos conditions d&apos;utilisation au Gabon.
          <br />
          <Link
            href="/login"
            className="text-jc-primary-green font-semibold hover:underline"
          >
            J&apos;ai déjà un compte
          </Link>
        </>
      }
    >
      <RegisterEmployerForm />
    </AuthCard>
  );
}
