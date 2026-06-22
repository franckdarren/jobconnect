import Link from "next/link";
import Image from "next/image";
import { Briefcase, Building2, ArrowRight } from "lucide-react";

export default function RegisterChoicePage() {
  return (
    <div className="w-full bg-white rounded-3xl shadow-sm p-6 sm:p-8">
      <div className="flex justify-center mb-4">
        <Image
          src="/images/logo.jpg"
          alt="241Job"
          width={56}
          height={56}
          priority
          className="w-14 h-14 rounded-xl object-cover"
        />
      </div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">241Job</h1>
        <h2 className="text-xl font-bold mt-3">Vous êtes ?</h2>
        <p className="text-sm text-jc-text-secondary mt-2">
          Choisissez votre profil pour commencer.
        </p>
      </div>

      <div className="space-y-3">
        <Link
          href="/register/candidate"
          className="group flex items-center gap-3 rounded-2xl bg-jc-light-green p-4 border border-jc-primary-green/10 hover:border-jc-primary-green/30 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-jc-primary-green" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-jc-text-primary">Chercheur d&apos;emploi</p>
            <p className="text-xs text-jc-text-secondary">
              Trouvez un job en 48h au Gabon
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-jc-primary-green" />
        </Link>

        <Link
          href="/register/employer"
          className="group flex items-center gap-3 rounded-2xl bg-jc-background p-4 border border-jc-primary-dark/10 hover:border-jc-primary-dark/30 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
            <Building2 className="w-5 h-5 text-jc-primary-dark" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-jc-text-primary">Employeur</p>
            <p className="text-xs text-jc-text-secondary">
              Recrutez les meilleurs talents
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-jc-primary-dark" />
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-jc-text-secondary">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="text-jc-primary-green font-semibold hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
