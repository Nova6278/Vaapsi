"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import { sanitize } from "@/lib/sanitize";

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
}

const NOTIF_SOUND_B64 =
  "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVYGAACAgICAgICAgICAgICAgICAgICAgICAgICAf3+AgYGBgIB/f35+fn5/f4CAgYGBgYGAgH9+fX19fn5/gIGBgoKCgYF/fn18fH1+f4CBgoODgoKBf358fHx9fn+AgYKDg4OCgX9+fHt8fX5/gIGCg4SDgoF/fnx7e3x+f4CBgoOEg4KBf357e3t8fX+AgYKDhIOCgX9+fHt7fH1/gIGCg4SDgoF/fnx7e3x9f4CBgoOEg4OBf358e3t8fX+AgYKDhIOCgX9+fHt7fH1/gIGCg4SDg4F/fn17e3x9f4CBgoOEhIOBgH58e3t8fX+AgYKDhISDgYB+fHt7fH1/gIGCg4SEg4GAfnx7e3x9f4CBgoOEhIOBgH58e3t8fX+AgYKDhISDgYB+fHt7fH5/gIGCg4SEg4GAfnx7fHx9f4CBgoOEhIOBgH58e3x8fX+AgYKDhISDgYB+fHt8fH1/gIGCg4SEg4GAfn17fHx9f4CBgoOEhIOBgH59e3x8fX+AgYKDhISDgYB+fXt8fH1/gIGCg4SEg4KAfn17fHx9f4CBgoOEhIOCgH59e3x8fX+AgYKDhISDgoB+fXt8fH5/gIGCg4SEg4KAfn17fHx+f4CBgoOEhIOCgH59fHx8fn+AgYKDhISDgoB+fXx8fH5/gIGCg4SEg4KAfn18fHx+f4CBgoOEhIOCgH5+fHx9fn+AgYKDhISDgoB/fn18fH1+f4CBgoOEhIOCgH9+fXx9fn+AgYKDhISDgoB/fn18fX5/gIGCg4SEg4KAf359fH1+f4CBgoOEg4OCgH9+fX19fn+AgYKDhIODgoB/fn19fX5/gIGCg4SDg4KAf35+fX1+f4CBgoOEg4OCgH9/fn19fn+AgYKDhIODgoCAf35+fX5/gIGCg4SDg4KBAH9+fn5+f4CBgoOEg4OCgYB/fn5+fn+AgYKDg4ODgoGAf39+fn5/gIGCg4ODg4KBgH9/fn5+f4CBgoODg4OCgYCAf39+fn+AgIGCg4ODg4KBgIB/f39/f4CAgYKDg4ODgoGAgH9/f39/gICBgoODg4OCgYCAf39/f3+AgIGCg4ODgoKBgICAf39/f4CAgYKDg4OCgoGAgIB/f39/gICBgoKDg4KCgYCAgH+Af3+AgIGCgoODgoKBgICAgH+Af4CAgYKCg4OCgoGBgICAgICAgICAgYKCg4OCgoGBgICAgICAgICAgYKCgoOCgoKBgYCAgICAgICAgIGCgoKDgoKCgYGAgICAgICAgICBgoKCg4KCgoGBgICAgICAgICAgYGCgoKCgoKBgYGAgICAgICAgICBgYKCgoKCgoGBgYCAgICAgICAgIGBgoKCgoKCgYGBgICAgICAgICAgYGBgoKCgoKBgYGAgICAgICAgICBgYGCgoKCgoGBgYCAgICAgICAgIGBgYKCgoKCgYGBgICAgICAgICAgYGBgoKCgoGBgYGAgICAgICAgICBgYGBgoKCgoGBgYGAgICAgICAgICBgYGBgoKCgYGBgYCAgICAgICAgICBgYGBgoKCgYGBgYCAgICAgICAgICBgYGBgoKCgYGBgYCAgICAgICAgICBgYGBgoKCgYGBgYCAgICAgICAgICBgYGBgYKCgYGBgYCAgICAgICAgICBgYGBgYKCgYGBgYGAgICAgICAgICBgYGBgYKCgYGBgYGAgICAgICAgICBgYGBgYGCgYGBgYGAgICAgICAgICAgYGBgYGCgYGBgYGAgICAgICAgICAgYGBgYGBgYGBgYGAgICAgICAgICAgYGBgYGBgYGBgYGAgICAgICAgICAgYGBgYGBgYGBgYGAgICAgICAgICAgYGBgYGBgYGBgYGAgICAgICAgICAgYGBgYGBgYGBgYCAgICAgICAgICAgYGBgYGBgYGBgYCAgICAgICAgICAgYGBgYGBgYGBgYCAgICAgICAgICAgIGBgYGBgYGBgYCAgICAgICAgICAgIGBgYGBgYGBgYCAgICAgICAgICAgIGBgYGBgYGBgICAgICAgICAgICAgIGBgYGBgYGBgICAgICAgICAgICAgICBgYGBgYGBgICAgICAgICAgICAgICBgYGBgYGBgICAgICAgICAgICAgICBgYGBgYGAgICAgICAgICAgICAgICAgYGBgYGAgICAgICAgICAgICAgICAgYGBgYGAgICAgICAgICAgICAgICAgYGBgYGAgICAgICAgICAgICAgICAgIGBgYGAgICAgICAgICAgICAgICAgICBgYGAgICAgICAgICAgA==";

export default function HandoffChat() {
  const params = useParams();
  const router = useRouter();
  const handoffId = params.id as string;
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [handoff, setHandoff] = useState<HandoffRow | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    audioRef.current = new Audio(NOTIF_SOUND_B64);
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

  useEffect(() => {
    if (!handoffId || !userId) return;

    let polling = false;
    const interval = setInterval(async () => {
      if (polling) return;
      polling = true;
      try {
        const { data: msgs } = await supabase
          .from("handoff_messages")
          .select("*")
          .eq("handoff_id", handoffId)
          .order("created_at", { ascending: true });

        if (msgs) {
          setMessages(msgs as MessageRow[]);

          if (msgs.length > prevMsgCountRef.current) {
            const newMsgs = msgs.slice(prevMsgCountRef.current);
            const hasOtherMsg = newMsgs.some((m) => m.sender_id !== userId);

            if (hasOtherMsg) {
              const lastOtherMsg = [...newMsgs].reverse().find((m) => m.sender_id !== userId);
              if (lastOtherMsg) {
                notifyNewMessage(lastOtherMsg.content);
              }
            }

            prevMsgCountRef.current = msgs.length;
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          }

          const unread = msgs.filter(
            (m) => m.sender_id !== userId && !m.is_read
          );
          if (unread.length > 0) {
            await supabase
              .from("handoff_messages")
              .update({ is_read: true })
              .in("id", unread.map((m) => m.id));
          }
        }
      } finally {
        polling = false;
      }
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoffId, userId, notifyNewMessage]);

  const sendMessage = useCallback(async () => {
    if (!newMsg.trim() || sending || handoff?.status !== "active") return;
    setSending(true);

    const sanitized = sanitize(newMsg.trim());

    const optimisticMsg: MessageRow = {
      id: crypto.randomUUID(),
      handoff_id: handoffId,
      sender_id: userId!,
      content: sanitized,
      image_url: null,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages((prev) => {
      const updated = [...prev, optimisticMsg];
      prevMsgCountRef.current = updated.length;
      return updated;
    });
    setNewMsg("");

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    await supabase.from("handoff_messages").insert({
      handoff_id: handoffId,
      sender_id: userId,
      content: sanitized,
    });

    setSending(false);
  }, [newMsg, sending, handoff?.status, handoffId, userId, supabase]);

  const isOwner = userId === handoff?.user_1;

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

    setHandoff(handoff ? { ...handoff, status: "completed" } : null);
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
                  <p className="text-[10px] mt-1" style={{ color: isMine ? 'rgba(255,255,255,0.5)' : '#4a5068' }}>
                    {new Date(msg.created_at).toLocaleString('en-IN', {
                      hour: '2-digit', minute: '2-digit', hour12: true
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {handoff?.status === "active" ? (
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
      ) : (
        <div className="sticky bottom-0 px-4 py-4 text-center"
          style={{ background: 'rgba(5,10,21,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs" style={{ color: '#4a5068' }}>
            This handoff is complete. Item has been returned. 🎉
          </p>
        </div>
      )}
    </main>
  );
}