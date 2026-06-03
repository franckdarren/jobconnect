export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-jc-background flex flex-col items-center px-4 py-6 sm:py-12">
      <div className="w-full max-w-md my-auto">{children}</div>
    </div>
  );
}
