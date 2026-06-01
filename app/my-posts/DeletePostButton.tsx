"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { createNotificationClient } from "@/lib/notifications-client";

export default function DeletePostButton({ postId, postTitle }: { postId: string; postTitle: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleDelete = async () => {
    setDeleting(true);

    // 1. Fetch claimant IDs before cascade kills them
    const { data: claims } = await supabase
      .from("claims")
      .select("claimant_id")
      .eq("post_id", postId);

    // 2. Delete FIRST
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete post. Try again.");
      setDeleting(false);
      setConfirming(false);
      return;
    }

    // 3. Notify ONLY after confirmed delete
    if (claims && claims.length > 0) {
      const uniqueClaimants = [...new Set(claims.map((c) => c.claimant_id))];
      await Promise.all(
        uniqueClaimants.map((claimantId) =>
          createNotificationClient({
            userId: claimantId,
            message: `Post "${postTitle}" was deleted by the poster. Your claim has been removed.`,
          })
        )
      );
    }

    router.refresh();
    setConfirming(false);
    setDeleting(false);
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
          style={{ background: "#3d1515", color: "#f87171", border: "1px solid #7f1d1d" }}
        >
          {deleting ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.06)", color: "#8b92a5" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-80"
      style={{ color: "#f87171" }}
      title="Delete post"
    >
      🗑️
    </button>
  );
}