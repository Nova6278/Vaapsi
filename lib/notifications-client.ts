type NotificationInput = {
  userId: string;
  message: string;
  claimId?: string;
  postId?: string;
};

export async function createNotificationClient({
  userId,
  message,
  claimId,
  postId,
}: NotificationInput) {
  try {
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message, claimId, postId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("Notification failed:", res.status, data);
    }
  } catch (err) {
    console.error("Notification failed:", err);
  }
}