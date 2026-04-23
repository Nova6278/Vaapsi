import { createServerSupabase } from "./supabase-server";

type NotificationInput = {
  userId: string;
  message: string;
  claimId?: string;
};

export async function createNotification({
  userId,
  message,
  claimId,
}: NotificationInput) {
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    message,
    claim_id: claimId ?? null,
  });

  if (error) {
    console.error("Failed to create notification:", error);
    return { success: false, error };
  }

  return { success: true };
}