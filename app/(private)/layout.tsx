import { requireUser } from "@/lib/supabase/dal";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/sidebar";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  const accountSlot = (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <form action={logout}>
        <button type="submit" className="btn-secondary !px-3 !py-1.5">
          Esci
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <Sidebar accountSlot={accountSlot} />
      <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 animate-fade-in">{children}</div>
    </div>
  );
}
