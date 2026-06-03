import Link from "next/link";
import { RegisterCandidateForm } from "./register-form";
import { AuthCard } from "@/components/shared/AuthCard";

export default function RegisterCandidatePage() {
  return (
    <AuthCard
      title="Trouve un job en 48h au Gabon"
      subtitle="Inscription 100% gratuite. Pas besoin de CV."
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
      <RegisterCandidateForm />
    </AuthCard>
  );
}
