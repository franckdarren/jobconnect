import { AppHeader } from "@/components/shared/AppHeader";
import { BottomNav } from "@/components/shared/BottomNav";
import { SideNav } from "@/components/shared/SideNav";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-jc-background md:flex">
      <SideNav role="employer" />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader role="employer" />
        <main className="flex-1 w-full mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-24 md:pb-10 max-w-md md:max-w-4xl lg:max-w-6xl">
          {children}
        </main>
      </div>
      <BottomNav role="employer" />
    </div>
  );
}
