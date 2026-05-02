import { createServerSupabase } from "./supabase-server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type NotificationInput = {
  userId: string;
  message: string;
  claimId?: string;
  userEmail?: string;
};

export async function createNotification({
  userId,
  message,
  claimId,
  userEmail,
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

  // Send email if we have the user's email
  if (userEmail) {
    try {
      await resend.emails.send({
        from: "Vaapsi <onboarding@resend.dev>",
        to: userEmail,
        subject: "New notification from Vaapsi",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #111;">Vaapsi — Lost & Found</h2>
            <p style="font-size: 16px; color: #333;">${message}</p>
            <a href="https://vaapsi.vercel.app/notifications" 
               style="display: inline-block; margin-top: 16px; padding: 10px 20px; 
                      background: #000; color: #fff; border-radius: 8px; 
                      text-decoration: none; font-weight: 600;">
              View Notifications
            </a>
            <p style="margin-top: 24px; font-size: 12px; color: #999;">
              You're receiving this because you have an account on Vaapsi.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      // Don't fail the whole operation if email fails
      console.error("Failed to send email:", emailError);
    }
  }

  return { success: true };
}