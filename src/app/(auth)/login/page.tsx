import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/shared/AuthCard";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthCard
      title="Bienvenue sur JobConnect"
      subtitle="Connectez-vous avec votre numéro WhatsApp."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="text-jc-primary-green font-semibold hover:underline"
          >
            Créer un compte
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
