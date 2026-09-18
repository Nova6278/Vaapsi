"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { logError } from "@/lib/logger";

export default function DeletePostButton({ postId }: { postId: string; postTitle?: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);

    // Deletion is fully server-side now (audit M1): the route collects
    // claimants BEFORE deleting, cleans up the storage image, and notifies
    // claimants reliably. The old client flow deleted first and then hit
    // /api/notify without a postId — a guaranteed 403, so claimants were
    // never actually notified.
    try {
      const res = await fetch("/api/posts/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        logError("Delete failed:", data);
        alert((data as { error?: string }).error ?? "Failed to delete post. Try again.");
        setDeleting(false);
        setConfirming(false);
        return;
      }
    } catch (err) {
      logError("Delete failed:", err);
      alert("Failed to delete post. Try again.");
      setDeleting(false);
      setConfirming(false);
      return;
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