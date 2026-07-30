import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Area privata
      </h1>
      <LoginForm redirectTo={redirect ?? "/spese"} />
    </main>
  );
}
