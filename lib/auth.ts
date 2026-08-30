import "server-only";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getOwner() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const ownerUserId = process.env.OWNER_USER_ID;

  if (error || !userId) return null;
  if (!ownerUserId) throw new Error("OWNER_USER_ID is not configured");
  if (userId !== ownerUserId) return null;

  return { userId, claims: data.claims, supabase };
}

export async function requireOwner() {
  const owner = await getOwner();
  if (!owner) redirect("/auth/login");
  return owner;
}

export async function requireOwnerForAction() {
  const owner = await getOwner();
  if (!owner) throw new Error("Not authorized");
  return owner;
}
