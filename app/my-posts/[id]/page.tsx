"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";
import { createNotificationClient } from "@/lib/notifications-client";

export default function PostClaims() {
  const params = useParams();
  const postId = params.id as string;
  const [claims, setClaims] = useState<any[]>([]);
  const [post, setPost] = useState<{ title: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const fetch = async () => {
      const [{ data: claimsData }, { data: postData }] = await Promise.all([
        supabase.from("claims").select("*").eq("post_id", postId),
        supabase.from("posts").select("title, type").eq("id", postId).single(),
      ]);
      setClaims(claimsData ?? []);
      setPost(postData);
      setLoading(false);
    };
    fetch();
  }, [postId]);

  const updateClaim = async (claimId: string, status: "confirmed" | "rejected") => {
    await supabase.from("claims").update({ status }).eq("id", claimId);
    setClaims(claims.map((c) => (c.id === claimId ? { ...c, status } : c)));

    const claim = claims.find((c) => c.id === claimId);
    if (claim && post) {
      await createNotificationClient({
        userId: claim.claimant_id,
        message: status === "confirmed"
          ? `Your claim for "${post.title}" was confirmed! 🎉`
          : `Your claim for "${post.title}" was rejected.`,
        claimId,
      });
    }
  };

  if (loading) return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="flex items-center justify-center">
      <p style={{ color: '#8b92a5' }}>Loading...</p>
    </main>
  );

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            {post && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={post.type === 'lost'
                  ? { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }
                  : { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }}>
                {post.type}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#f0f2f5' }}>
            {post?.title ?? 'Claims'}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8b92a5' }}>
            {claims.length} claim{claims.length !== 1 ? 's' : ''} submitted
          </p>
        </div>

        {/* Empty */}
        {claims.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-4">🕊️</p>
            <p style={{ color: '#8b92a5' }}>No claims yet.</p>
          </div>
        )}

        {/* Claims */}
        <div className="flex flex-col gap-3">
          {claims.map((claim) => (
            <div key={claim.id} className="rounded-2xl p-5"
              style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Status badge + date */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={
                    claim.status === 'confirmed'
                      ? { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }
                      : claim.status === 'rejected'
                      ? { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }
                      : { background: 'rgba(255,255,255,0.06)', color: '#8b92a5', border: '1px solid rgba(255,255,255,0.1)' }
                  }>
                  {claim.status}
                </span>
                <span className="text-xs" style={{ color: '#4a5068' }}>
                  {new Date(claim.created_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                  })}
                </span>
              </div>

              {/* Answer */}
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5068' }}>
                Their answer
              </p>
              <p className="text-sm" style={{ color: '#f0f2f5' }}>{claim.answer}</p>

              {/* Actions */}
              {claim.status === "pending" && (
                <div className="flex gap-2 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={() => updateClaim(claim.id, "confirmed")}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }}>
                    ✓ Confirm
                  </button>
                  <button onClick={() => updateClaim(claim.id, "rejected")}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }}>
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Back */}
        <a href="/my-posts" className="block mt-6 text-center text-xs" style={{ color: '#4a5068' }}>
          ← Back to my posts
        </a>
      </div>
    </main>
  );
}