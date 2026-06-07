"use client";

import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Step = {
  title: string;
  description: string;
  target?: string;
};

const STEPS: Step[] = [
  {
    title: "Welcome to Vaapsi 👋",
    description: "Campus lost & found — built for KIIT students. This quick tour shows you around.",
  },
  {
    title: "Search posts 🔍",
    description: "Search for lost or found items by title, description, or location.",
    target: '[data-tutorial="search"]',
  },
  {
    title: "Filter by type 🔖",
    description: "Switch between All, Lost, and Found posts.",
    target: '[data-tutorial="typefilter"]',
  },
  {
    title: "Post an item 📝",
    description: "Lost something? Found something? Create a listing here.",
    target: '[data-tutorial="newpost"]',
  },
  {
    title: "Handoffs 🤝",
    description: "When a claim is confirmed, a handoff chat opens to coordinate the return.",
    target: '[data-tutorial="handoff"]',
  },
  {
    title: "Notifications 🔔",
    description: "See claim updates, matches, and other alerts here.",
    target: '[data-tutorial="bell"]',
  },
  {
    title: "My Posts 📋",
    description: "View your listings and manage incoming claims.",
    target: '[data-tutorial="myposts"]',
  },
  {
    title: "My Claims ✅",
    description: "Track all claims you've submitted and their status.",
    target: '[data-tutorial="myclaims"]',
  },
];

const PADDING = 8;
const TOOLTIP_MAX_WIDTH = 320;
const SCREEN_MARGIN = 16;

type TargetRect = { top: number; left: number; width: number; height: number };

export default function Tutorial({ userId }: { userId: string | null }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  useEffect(() => {
    if (!userId) return;
    const check = async () => {
      const { data } = await supabase
        .from("users")
        .select("tutorial_done")
        .eq("id", userId)
        .single();
      if (data && !data.tutorial_done) setVisible(true);
    };
    check();
  }, [userId]);

  const finish = useCallback(async () => {
    setVisible(false);
    if (!userId) return;
    await supabase
      .from("users")
      .update({ tutorial_done: true })
      .eq("id", userId);
  }, [userId]);

  const measureTarget = useCallback(() => {
    const selector = STEPS[step].target;
    if (!selector) { setTargetRect(null); return; }
    const el = document.querySelector(selector);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useLayoutEffect(() => {
  if (!visible) return;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  measureTarget();
}, [visible, step, measureTarget]);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener("resize", measureTarget);
    return () => window.removeEventListener("resize", measureTarget);
  }, [visible, measureTarget]);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  let highlightStyle: React.CSSProperties | null = null;
  let tooltipStyle: React.CSSProperties;

  if (targetRect) {
    const ht = targetRect.top - PADDING;
    const hl = targetRect.left - PADDING;
    const hw = targetRect.width + PADDING * 2;
    const hh = targetRect.height + PADDING * 2;

    highlightStyle = {
      position: "fixed",
      top: ht,
      left: hl,
      width: hw,
      height: hh,
      border: "2px solid #D4AF37",
      borderRadius: 12,
      boxShadow: "0 0 0 4px rgba(212,175,55,0.2), 0 0 24px rgba(212,175,55,0.15)",
      zIndex: 101,
      pointerEvents: "none",
    };

    const targetCenterY = targetRect.top + targetRect.height / 2;
    const inTopHalf = targetCenterY < window.innerHeight / 2;
    const tooltipW = Math.min(TOOLTIP_MAX_WIDTH, window.innerWidth - SCREEN_MARGIN * 2);
    const tooltipLeft = Math.min(
      Math.max(SCREEN_MARGIN, targetRect.left + targetRect.width / 2 - tooltipW / 2),
      window.innerWidth - tooltipW - SCREEN_MARGIN
    );

    if (inTopHalf) {
      tooltipStyle = { position: "fixed", top: ht + hh + 12, left: tooltipLeft, width: tooltipW, zIndex: 102 };
    } else {
      tooltipStyle = { position: "fixed", bottom: window.innerHeight - ht + 12, left: tooltipLeft, width: tooltipW, zIndex: 102 };
    }
  } else {
    tooltipStyle = {
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 32px)",
      maxWidth: TOOLTIP_MAX_WIDTH,
      zIndex: 102,
    };
  }

  return (
    <>
      <div
        className="fixed inset-0"
        style={{ background: "rgba(0,0,0,0.75)", zIndex: 100 }}
        onClick={finish}
      />

      {highlightStyle && <div style={highlightStyle} />}

      <div
        style={{
          ...tooltipStyle,
          background: "#0d1225",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full rounded-full mb-5 overflow-hidden"
          style={{ height: "3px", background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #FDE68A, #D4AF37)" }}
          />
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#4a5068" }}>
          Step {step + 1} of {STEPS.length}
        </p>

        <h2 className="text-base font-bold mb-2" style={{ color: "#f0f2f5" }}>{current.title}</h2>
        <p className="text-sm leading-relaxed" style={{ color: "#8b92a5" }}>{current.description}</p>

        <div className="flex gap-1.5 mt-5 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? "16px" : "6px",
                height: "6px",
                background: i === step ? "#D4AF37" : i < step ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button onClick={finish} className="text-xs transition-opacity hover:opacity-80" style={{ color: "#4a5068" }}>
            Skip tour
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.06)", color: "#8b92a5", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                Back
              </button>
            )}
            <button
              onClick={() => { if (isLast) finish(); else setStep(step + 1); }}
              className="px-5 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #FDE68A 0%, #D4AF37 50%, #A68A3E 100%)", color: "#080c18" }}
            >
              {isLast ? "Done ✓" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}