import { requireRole } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export default async function AdminSettingsPage() {
  const user = await requireRole("admin");

  return (
    <div className="space-y-6 max-w-lg">
      <header>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-jc-text-secondary mt-1">
          Sécurité de votre compte administrateur.
        </p>
      </header>

      <section className="jc-card p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Mot de passe</h2>
          <p className="text-xs text-jc-text-muted mt-1">
            Compte : {user.email}
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
