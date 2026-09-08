"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOwner } from "@/lib/supabase/owner";

export type UpdatePasswordState = { error?: string } | undefined;

export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password-confirm") ?? "");

  if (password.length < 8) {
    return { error: "La password deve avere almeno 8 caratteri." };
  }
  if (password !== passwordConfirm) {
    return { error: "Le due password non coincidono." };
  }

  const supabase = await createClient();

  // La sessione qui è quella temporanea di recovery creata da
  // /auth/callback tramite il link ricevuto via email: senza una sessione
  // valida dell'account proprietario, updateUser fallisce.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isOwner(user?.email)) {
    return { error: "Link scaduto o non valido, richiedine uno nuovo." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Non è stato possibile aggiornare la password, riprova." };
  }

  redirect("/spese");
}
