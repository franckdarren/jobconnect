import { AppHeader } from "@/components/shared/AppHeader";
import { BottomNav } from "@/components/shared/BottomNav";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-jc-background flex flex-col">
      <AppHeader role="candidate" />
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-24">
        {children}
      </main>
      <BottomNav role="candidate" />
    </div>
  );
}
