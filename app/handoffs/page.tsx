"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HandoffItem {
  id: string;
  post_id: string;
  user_1: string;
  user_2: string;
  status: string;
  created_at: string;
  post_title: string;
  unread: number;
}

export default function HandoffsList() {
  const router = useRouter();
  const [handoffs, setHandoffs] = useState<HandoffItem[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchHandoffs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Get all handoffs where user is participant
      const { data: myHandoffs } = await supabase
        .from("handoffs")
        .select("*")
        .or(`user_1.eq.${user.id},user_2.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!myHandoffs || myHandoffs.length === 0) {
        setHandoffs([]);
        setLoading(false);
        return;
      }

      // Fetch post titles + unread counts
      const results: HandoffItem[] = [];

      for (const h of myHandoffs) {
        const { data: post } = await supabase
          .from("posts")
          .select("title")
          .eq("id", h.post_id)
          .single();

        const { count } = await supabase
          .from("handoff_messages")
          .select("*", { count: "exact", head: true })
          .eq("handoff_id", h.id)
          .neq("sender_id", user.id)
          .eq("is_read", false);

        results.push({
          ...h,
          post_title: post?.title ?? "Unknown item",
          unread: count ?? 0,
        });
      }

      setHandoffs(results);
      setLoading(false);
    };
    fetchHandoffs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return (
    <main style={{ background: '#050a15', minHeight: '100vh' }} className="flex items-center justify-center">
      <p style={{ color: '#8b92a5' }}>Loading...</p>
    </main>
  );

  return (
    <main style={{ background: '#050a15', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">

        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: '#f0f2f5' }}>Handoffs</h1>
          <p className="text-sm mt-1" style={{ color: '#8b92a5' }}>
            Coordinate item returns
          </p>
        </div>

        {handoffs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-4">🤝</p>
            <p style={{ color: '#8b92a5' }}>No active handoffs yet.</p>
            <p className="text-xs mt-2" style={{ color: '#4a5068' }}>
              Handoffs are created when a claim is confirmed.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {handoffs.map((h) => (
            <Link key={h.id} href={`/handoff/${h.id}`}>
              <div className="rounded-2xl p-5 transition-all hover:scale-[1.01]"
                style={{
                  background: 'rgba(13,18,37,0.6)',
                  border: h.unread > 0
                    ? '1px solid rgba(24,95,165,0.4)'
                    : '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                  cursor: 'pointer',
                }}>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={h.status === 'active'
                      ? { background: 'rgba(24,95,165,0.15)', color: '#5b9bd5', border: '1px solid rgba(24,95,165,0.3)' }
                      : { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }
                    }>
                    {h.status === 'active' ? 'Active' : 'Completed'}
                  </span>

                  <div className="flex items-center gap-2">
                    {h.unread > 0 && (
                      <span className="text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold"
                        style={{ background: '#185FA5', color: '#fff' }}>
                        {h.unread}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: '#4a5068' }}>
                      {new Date(h.created_at).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                      })}
                    </span>
                  </div>
                </div>

                <h2 className="text-sm font-semibold" style={{ color: '#f0f2f5' }}>
                  {h.post_title}
                </h2>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/dashboard" className="block mt-6 text-center text-xs" style={{ color: '#4a5068' }}>
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}