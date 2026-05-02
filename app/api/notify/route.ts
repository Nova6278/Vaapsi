import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { userId, message, claimId } = await req.json();

  if (!userId || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminSupabase();

  // Insert the notification
  const { error: notifError } = await supabase.from("notifications").insert({
    user_id: userId,
    message,
    claim_id: claimId ?? null,
  });

  if (notifError) {
    return NextResponse.json({ error: notifError.message }, { status: 500 });
  }

  // Get the user's email from auth.users
  const { data: userData, error: userError } =
    await supabase.auth.admin.getUserById(userId);

  if (!userError && userData?.user?.email) {
    try {
      await resend.emails.send({
        from: "Vaapsi <onboarding@resend.dev>",
        to: userData.user.email,
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
      console.error("Email failed:", emailError);
      // Don't fail — notification already saved
    }
  }

  return NextResponse.json({ success: true });
}