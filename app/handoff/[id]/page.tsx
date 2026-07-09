"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import { sanitize } from "@/lib/sanitize";
import { logError } from "@/lib/logger";
import Link from "next/link";
import { DEMO_ACCOUNT_IDS } from "@/lib/demo"

interface HandoffRow {
  id: string;
  post_id: string;
  user_1: string;
  user_2: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface MessageRow {
  id: string;
  handoff_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  is_read: boolean;
  isOptimistic?: boolean;
}


export default function HandoffChat() {
  const params = useParams();
  const router = useRouter();
  const handoffId = params.id as string;
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevHandoffStatusRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [handoff, setHandoff] = useState<HandoffRow | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showLostPostPrompt, setShowLostPostPrompt] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  // Realtime health: assume healthy on mount (5s grace); flip false to activate
  // the polling fallback if Realtime never subscribes or later errors.
  const [realtimeHealthy, setRealtimeHealthy] = useState(true);

  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );

  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.wav");
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      if (typeof window !== "undefined" && "Notification" in window) {
        const perm = Notification.permission;
        setNotifPermission(perm);
        if (perm === "default") {
          Notification.requestPermission().then((result) => {
            setNotifPermission(result);
          });
        }
      } else {
        setNotifPermission("unsupported");
      }

      const { data: h } = await supabase
        .from("handoffs")
        .select("*")
        .eq("id", handoffId)
        .single();

      if (!h || (h.user_1 !== user.id && h.user_2 !== user.id)) {
        router.push("/dashboard");
        return;
      }
      setHandoff(h as HandoffRow);
      prevHandoffStatusRef.current = h.status;

      const { data: p } = await supabase
        .from("posts")
        .select("title")
        .eq("id", h.post_id)
        .single();
      setPostTitle(p?.title ?? "Item");

      const { data: msgs } = await supabase
        .from("handoff_messages")
        .select("*")
        .eq("handoff_id", handoffId)
        .order("created_at", { ascending: true });
      const msgList = (msgs as MessageRow[]) ?? [];
      setMessages(msgList);
      prevMsgCountRef.current = msgList.length;
      setLoading(false);

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

      await supabase
        .from("handoff_messages")
        .update({ is_read: true })
        .eq("handoff_id", handoffId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoffId]);

  const notifyNewMessage = useCallback((content: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {}

    if (!document.hasFocus() && notifPermission === "granted") {
      try {
        const n = new Notification("Vaapsi — New message", {
          body: content.length > 80 ? content.slice(0, 80) + "…" : content,
          icon: "/favicon.ico",
          tag: `vaapsi-handoff-${handoffId}`,
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch {}
    }
  }, [notifPermission, handoffId]);

  // Live updates via Supabase Realtime (with a polling fallback — see effect below)
  useEffect(() => {
    if (!handoffId || !userId) return;

    // If Realtime doesn't reach SUBSCRIBED within 5s, fall back to polling.
    const graceTimer = setTimeout(() => {
      logError("[handoff] Realtime not SUBSCRIBED within 5s — enabling polling fallback", null);
      setRealtimeHealthy(false);
    }, 5000);

    const channel = supabase
      .channel(`handoff-${handoffId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "handoff_messages", filter: `handoff_id=eq.${handoffId}` },
        (payload) => {
          const msg = payload.new as MessageRow;
          setMessages((prev) => {
            // Skip if we already have this row (our own echo, or a duplicate event)
            if (prev.some((m) => m.id === msg.id)) return prev;
            const updated = [...prev, msg];
            prevMsgCountRef.current = updated.length;
            return updated;
          });

          if (msg.sender_id !== userId) {
            notifyNewMessage(msg.content);
            // Mark the incoming message as read
            supabase
              .from("handoff_messages")
              .update({ is_read: true })
              .eq("id", msg.id);
          }

          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "handoffs", filter: `id=eq.${handoffId}` },
        (payload) => {
          const updatedHandoff = payload.new as HandoffRow;
          const wasActive = prevHandoffStatusRef.current === "active";
          const nowComplete = updatedHandoff.status === "completed";
          prevHandoffStatusRef.current = updatedHandoff.status;
          setHandoff(updatedHandoff);

          if (wasActive && nowComplete && userId) {
            supabase
              .from("posts")
              .select("id")
              .eq("user_id", userId)
              .eq("type", "lost")
              .eq("status", "active")
              .then(({ data: lostPosts }) => {
                if (lostPosts && lostPosts.length > 0) setShowLostPostPrompt(true);
              });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(graceTimer);
          setRealtimeHealthy(true); // clears polling if it was active (reconnect)
        } else if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          logError(`[handoff] Realtime status ${status} — enabling polling fallback`, null);
          setRealtimeHealthy(false);
        }
      });

    return () => {
      clearTimeout(graceTimer);
      supabase.removeChannel(channel);
    };
  }, [handoffId, userId, notifyNewMessage, supabase]);

  // Polling fallback: runs only while Realtime is unhealthy. Merges server truth
  // with any not-yet-persisted optimistic messages, deduped by id.
  useEffect(() => {
    if (!handoffId || !userId || realtimeHealthy) return;

    let inFlight = false;
    const pollOnce = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const [{ data: msgs }, { data: updatedHandoff }] = await Promise.all([
          supabase
            .from("handoff_messages")
            .select("*")
            .eq("handoff_id", handoffId)
            .order("created_at", { ascending: true }),
          supabase
            .from("handoffs")
            .select("*")
            .eq("id", handoffId)
            .single(),
        ]);

        if (updatedHandoff) {
          const wasActive = prevHandoffStatusRef.current === "active";
          const nowComplete = updatedHandoff.status === "completed";
          prevHandoffStatusRef.current = updatedHandoff.status;
          setHandoff(updatedHandoff as HandoffRow);
          if (wasActive && nowComplete && userId) {
            const { data: lostPosts } = await supabase
              .from("posts")
              .select("id")
              .eq("user_id", userId)
              .eq("type", "lost")
              .eq("status", "active");
            if (lostPosts && lostPosts.length > 0) setShowLostPostPrompt(true);
          }
        }

        if (msgs) {
          const serverMsgs = msgs as MessageRow[];
          const serverIds = new Set(serverMsgs.map((m) => m.id));

          if (serverMsgs.length > prevMsgCountRef.current) {
            const newMsgs = serverMsgs.slice(prevMsgCountRef.current);
            const lastOther = [...newMsgs].reverse().find((m) => m.sender_id !== userId);
            if (lastOther) notifyNewMessage(lastOther.content);
            prevMsgCountRef.current = serverMsgs.length;
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          }

          // Server is truth; keep only optimistic rows not yet persisted (dedupe by id)
          setMessages((prev) => {
            const pendingOptimistic = prev.filter((m) => m.isOptimistic && !serverIds.has(m.id));
            return [...serverMsgs, ...pendingOptimistic];
          });

          const unread = serverMsgs.filter((m) => m.sender_id !== userId && !m.is_read);
          if (unread.length > 0) {
            await supabase
              .from("handoff_messages")
              .update({ is_read: true })
              .in("id", unread.map((m) => m.id));
          }
        }
      } finally {
        inFlight = false;
      }
    };

    logError("[handoff] Polling fallback active (Realtime unhealthy)", null);
    pollOnce();
    const interval = setInterval(pollOnce, 2000);
    return () => clearInterval(interval);
  }, [handoffId, userId, realtimeHealthy, notifyNewMessage, supabase]);

  const sendMessage = useCallback(async () => {
    if (!newMsg.trim() || sending || handoff?.status !== "active") return;
    setSending(true);

    const sanitized = sanitize(newMsg.trim());

    const optimisticId = crypto.randomUUID();
    const optimisticMsg: MessageRow = {
      id: optimisticId,
      handoff_id: handoffId,
      sender_id: userId!,
      content: sanitized,
      image_url: null,
      created_at: new Date().toISOString(),
      is_read: false,
      isOptimistic: true,
    };
    setMessages((prev) => {
      const updated = [...prev, optimisticMsg];
      prevMsgCountRef.current = updated.length;
      return updated;
    });
    setNewMsg("");

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    // Insert and swap the optimistic placeholder for the real row, so the
    // Realtime echo (same real id) is de-duped by the INSERT handler.
    const { data: inserted } = await supabase
      .from("handoff_messages")
      .insert({
        handoff_id: handoffId,
        sender_id: userId,
        content: sanitized,
      })
      .select()
      .single();

    if (inserted) {
      // Drop the optimistic placeholder and add the real row only if the Realtime
      // echo hasn't already inserted it (avoids a duplicate key on a fast echo).
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
        if (withoutOptimistic.some((m) => m.id === inserted.id)) return withoutOptimistic;
        return [...withoutOptimistic, inserted as MessageRow];
      });
    }

    setSending(false);
  }, [newMsg, sending, handoff?.status, handoffId, userId, supabase]);

  const isOwner = userId === handoff?.user_1;
  const isDemo = userId ? DEMO_ACCOUNT_IDS.has(userId) : false;

  const completeHandoff = async () => {
    if (!isOwner) return;
    if (!confirm("Item returned? This will close the handoff permanently.")) return;

    const [r1, r2, r3] = await Promise.all([
      supabase.from("handoff_messages").update({ is_read: true }).eq("handoff_id", handoffId).eq("is_read", false),
      supabase.from("handoffs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", handoffId),
      supabase.from("posts").update({ status: "resolved" }).eq("id", handoff!.post_id),
    ]);

    if (r1.error || r2.error || r3.error) {
      alert("Something went wrong completing the handoff. Please try again.");
      return;
    }

    setHandoff(prev => prev ? { ...prev, status: "completed" } : null);
    if (userId) {
  const { data: lostPosts } = await supabase
    .from("posts")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "lost")
    .eq("status", "active")
    
  if (lostPosts && lostPosts.length > 0) setShowLostPostPrompt(true);
}
  };

  const myMsgCount = messages.filter((m) => m.sender_id === userId).length;
  const otherMsgCount = messages.filter((m) => m.sender_id !== userId).length;
  const canComplete = myMsgCount >= 2 && otherMsgCount >= 2;

  if (loading) return (
    <main style={{ background: '#050a15', minHeight: '100vh' }} className="flex items-center justify-center">
      <p style={{ color: '#8b92a5' }}>Loading...</p>
    </main>
  );

  return (
    <main style={{ background: '#050a15', minHeight: '100vh' }} className="flex flex-col">

      <div className="sticky top-0 z-10 px-4 py-3"
        style={{ background: 'rgba(5,10,21,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a5068' }}>
              Coordinating handoff
            </p>
            <h1 className="text-base font-bold" style={{ color: '#f0f2f5' }}>{postTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            {handoff?.status === "active" && isOwner && (
              canComplete ? (
                <button onClick={completeHandoff}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{ background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }}>
                  ✓ Item returned
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-not-allowed"
                  title="Both parties must send at least 2 messages before completing"
                  style={{ background: 'rgba(74,80,104,0.2)', color: '#4a5068', border: '1px solid rgba(255,255,255,0.06)' }}>
                  ✓ Item returned
                </span>
              )
            )}
            {handoff?.status === "completed" && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }}>
                Completed ✓
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-xl mx-auto flex flex-col gap-2">

          <div className="text-center py-4 mb-2">
            <p className="text-xs" style={{ color: '#4a5068' }}>
              🤝 Handoff started — coordinate the return of &quot;{postTitle}&quot;
            </p>
          </div>

          {messages.length === 0 && handoff?.status === "active" && (
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {["Where should we meet?", "I'm free now", "Can you come to the gate?", "What time works?"].map((q) => (
                <button key={q} onClick={() => setNewMsg(q)}
                  className="px-3 py-1.5 rounded-full text-xs transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(24,95,165,0.15)', color: '#5b9bd5', border: '1px solid rgba(24,95,165,0.3)' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.sender_id === userId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%] px-4 py-2.5 rounded-2xl"
                  style={isMine
                    ? { background: '#185FA5', borderBottomRightRadius: '4px' }
                    : { background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)', borderBottomLeftRadius: '4px' }
                  }>
                  <p className="text-sm" style={{ color: '#f0f2f5' }}>{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className="text-[10px]" style={{ color: isMine ? 'rgba(255,255,255,0.5)' : '#4a5068' }}>
                      {new Date(msg.created_at).toLocaleString('en-IN', {
                        hour: '2-digit', minute: '2-digit', hour12: true
                      })}
                    </p>
                    {isMine && (
                      <span style={{
                        fontSize: '10px',
                        lineHeight: 1,
                        color: !msg.isOptimistic && msg.is_read ? '#185FA5' : 'rgba(255,255,255,0.4)',
                      }}>
                        {msg.isOptimistic ? '✓' : '✓✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {handoff?.status === "active" ? (
        isDemo ? (
          <div className="sticky bottom-0 px-4 py-3"
            style={{ background: 'rgba(5,10,21,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="max-w-xl mx-auto text-center py-1">
              <p className="text-xs" style={{ color: '#4a5068' }}>
                Demo accounts cannot send messages.{' '}
                <Link href="/signup" style={{ color: '#5b9bd5' }}>Create a real account →</Link>
              </p>
            </div>
          </div>
        ) : (
        <div className="sticky bottom-0 px-4 py-3"
          style={{ background: 'rgba(5,10,21,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
          <div className="max-w-xl mx-auto flex gap-2">
            <input
              type="text"
              aria-label="Message"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#0d1225', color: '#f0f2f5', border: '1px solid rgba(255,255,255,0.06)' }}
            />
            <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: '#185FA5', color: '#fff' }}>
              Send
            </button>
          </div>
        </div>
        )
      ) : (
        <div className="sticky bottom-0 px-4 py-4"
  style={{ background: 'rgba(5,10,21,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
  <div className="max-w-xl mx-auto">
    <p className="text-xs text-center mb-3" style={{ color: '#4a5068' }}>
      This handoff is complete. Item has been returned. 🎉
    </p>
    {showLostPostPrompt && (
      <div className="rounded-xl p-4"
        style={{ background: '#0d1225', border: '1px solid rgba(212,175,55,0.3)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#D4AF37' }}>
          🎉 Got your item back?
        </p>
        <p className="text-xs mb-3" style={{ color: '#8b92a5' }}>
          You still have active Lost posts. If this handoff resolved one of them, mark it as resolved so others know.
        </p>
        <Link href="/my-posts"
  className="inline-block px-4 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
  style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
  View my Lost posts →
</Link>
      </div>
    )}
  </div>
</div>
      )}
    </main>
  );
}