"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import { createNotificationClient } from "@/lib/notifications-client";
import Image from "next/image";
import Link from "next/link";

interface ClaimRow {
  id: string;
  post_id: string;
  claimant_id: string;
  answer: string;
  status: string;
  created_at: string;
  proof_image_url: string | null;
}

export default function PostClaims() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [post, setPost] = useState<{ title: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: postData } = await supabase
        .from("posts")
        .select("title, type, user_id")
        .eq("id", postId)
        .single();

      if (!postData || postData.user_id !== user.id) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const { data: claimsData } = await supabase
        .from("claims")
        .select("*")
        .eq("post_id", postId);

      setPost({ title: postData.title, type: postData.type });
      setClaims((claimsData as ClaimRow[]) ?? []);

      const urls: Record<string, string> = {};
      for (const claim of (claimsData as ClaimRow[]) ?? []) {
        if (claim.proof_image_url) {
          const { data } = await supabase.storage
            .from("claim-proofs")
            .createSignedUrl(claim.proof_image_url, 3600);
          if (data?.signedUrl) {
            urls[claim.id] = data.signedUrl;
          }
        }
      }
      setProofUrls(urls);

      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (status === "confirmed") {
        await fetch("/api/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId,
            claimantId: claim.claimant_id,
          }),
        });
      }
    }
  };

  const refreshProofUrl = async (claimId: string, path: string) => {
    const { data } = await supabase.storage
      .from("claim-proofs")
      .createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      setProofUrls(prev => ({ ...prev, [claimId]: data.signedUrl }));
    }
  };

  if (loading) return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="flex items-center justify-center">
      <p style={{ color: '#8b92a5' }}>Loading...</p>
    </main>
  );

  if (unauthorized) return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="flex items-center justify-center px-4">
      <div className="rounded-2xl p-8 text-center max-w-sm w-full"
        style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-4xl mb-4">🚫</p>
        <h1 className="text-lg font-bold mb-2" style={{ color: '#f0f2f5' }}>Access denied</h1>
        <p className="text-sm mb-6" style={{ color: '#8b92a5' }}>
          You can only view claims on your own posts.
        </p>
        <Link href="/my-posts"
          className="inline-block py-2.5 px-6 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#185FA5' }}>
          Go to my posts
        </Link>
      </div>
    </main>
  );

  const isLostPost = post?.type === 'lost';

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">

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
            {claims.length} {isLostPost ? 'response' : 'claim'}{claims.length !== 1 ? 's' : ''} submitted
          </p>
        </div>

        {claims.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-4">🕊️</p>
            <p style={{ color: '#8b92a5' }}>No {isLostPost ? 'responses' : 'claims'} yet.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {claims.map((claim) => (
            <div key={claim.id} className="rounded-2xl p-5"
              style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>

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

              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5068' }}>
                {isLostPost ? 'Their description' : 'Their answer'}
              </p>
              <p className="text-sm" style={{ color: '#f0f2f5' }}>{claim.answer}</p>

              {proofUrls[claim.id] && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5068' }}>
                    Photo proof
                  </p>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Image
                      src={proofUrls[claim.id]}
                      alt="Proof photo"
                      width={600}
                      height={400}
                      className="w-full max-h-64 object-cover cursor-pointer transition-opacity hover:opacity-90"
                      onClick={() => setLightboxUrl(proofUrls[claim.id])}
                      onError={() => {
                        if (claim.proof_image_url) refreshProofUrl(claim.id, claim.proof_image_url)
                      }}
                      unoptimized
                    />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: '#4a5068' }}>
                    Click image to view full size
                  </p>
                </div>
              )}

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

        <Link href="/my-posts" className="block mt-6 text-center text-xs" style={{ color: '#4a5068' }}>
          ← Back to my posts
        </Link>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#f0f2f5' }}
            onClick={() => setLightboxUrl(null)}
          >
            ✕
          </button>
          <Image
            src={lightboxUrl}
            alt="Proof full size"
            width={1200}
            height={900}
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
            unoptimized
          />
        </div>
      )}
    </main>
  );
}