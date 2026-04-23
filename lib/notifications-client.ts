import { createBrowserClient } from "@supabase/ssr";

type NotificationInput = {
  userId: string;
  message: string;
  claimId?: string;
};

export async function createNotificationClient({
  userId,
  message,
  claimId,
}: NotificationInput) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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