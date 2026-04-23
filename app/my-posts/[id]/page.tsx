"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";

export default function PostClaims() {
  const params = useParams();
  const postId = params.id as string;
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const fetchClaims = async () => {
      const { data } = await supabase
        .from("claims")
        .select("*")
        .eq("post_id", postId);
      setClaims(data ?? []);
      setLoading(false);
    };
    fetchClaims();
  }, [postId]);

  const updateClaim = async (
    claimId: string,
    status: "confirmed" | "rejected",
  ) => {
    await supabase.from("claims").update({ status }).eq("id", claimId);
    setClaims(claims.map((c) => (c.id === claimId ? { ...c, status } : c)));
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Claims</h1>

      {claims.length === 0 && <p className="text-gray-500">No claims yet.</p>}

      <div className="flex flex-col gap-4">
        {claims.map((claim) => (
          <div key={claim.id} className="border rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Answer:</p>
            <p className="font-medium">{claim.answer}</p>
            <p className="text-xs text-gray-500 mt-2">Status: {claim.status}</p>

            {claim.status === "pending" && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => updateClaim(claim.id, "confirmed")}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Confirm
                </button>
                <button
                  onClick={() => updateClaim(claim.id, "rejected")}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
