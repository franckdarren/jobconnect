import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import { NavMenu } from "./NavMenu";

type Role = "candidate" | "employer";

const PREFIX: Record<Role, string> = {
  candidate: "/c",
  employer: "/e",
};

export function AppHeader({
  role,
  isPremium = false,
}: {
  role: Role;
  isPremium?: boolean;
}) {
  const prefix = PREFIX[role];
  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-black/4">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
        <NavMenu role={role} isPremium={isPremium} />
        <Link
          href={`${prefix}/home`}
          className="font-bold text-lg text-jc-text-primary tracking-tight"
        >
          JobConnect
        </Link>
        <div className="flex items-center gap-1 -mr-1">
          <NotificationBell role={role} />
        </div>
      </div>
    </header>
  );
}
