import { getCurrentUser } from "@/lib/auth";
import { getActiveSubscription } from "@/features/payments/queries";
import { AppHeader } from "@/components/shared/AppHeader";
import { BottomNav } from "@/components/shared/BottomNav";
import { SideNav } from "@/components/shared/SideNav";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const subscription = user ? await getActiveSubscription(user.id) : null;
  const isPremium = subscription?.plan === "candidate_premium";

  return (
    <div className="min-h-screen bg-jc-background md:flex">
      <SideNav role="candidate" isPremium={isPremium} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader role="candidate" isPremium={isPremium} />
        <main className="flex-1 w-full mx-auto overflow-x-clip px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-24 md:pb-10 max-w-md md:max-w-4xl lg:max-w-6xl">
          {children}
        </main>
      </div>
      <BottomNav role="candidate" />
    </div>
  );
}
