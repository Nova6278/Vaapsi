import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const notifySchema = z.object({
  userId: z.string().uuid(),
  message: z.string().min(1).max(500),
  claimId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = notifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { userId, message, claimId, postId } = parsed.data;

  const supabase = createAdminSupabase();

  const { error: notifError } = await supabase.from("notifications").insert({
    user_id: userId,
    message,
    claim_id: claimId ?? null,
    post_id: postId ?? null,
  });

  if (notifError) {
    return NextResponse.json({ error: notifError.message }, { status: 500 });
  }

  const { data: userData, error: userError } =
    await supabase.auth.admin.getUserById(userId);

  if (!userError && userData?.user?.email) {
    const sendEmail = async (attempt = 1): Promise<void> => {
      try {
        await resend.emails.send({
          from: "Vaapsi <onboarding@resend.dev>",
          to: userData.user.email!,
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
        if (attempt < 2) {
          await sendEmail(attempt + 1);
        } else {
          console.error("Email failed after retry:", emailError);
        }
      }
    };
    await sendEmail();
  }

  return NextResponse.json({ success: true });
}