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
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message, claimId }),
    });
  } catch (err) {
    console.error("Notification failed:", err);
  }
}