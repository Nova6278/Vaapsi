"use client";

import { useState } from "react";

export default function RefreshButton({ onRefresh }: { onRefresh: () => void }) {
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    if (spinning) return;
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 1000);
  };

  return (
    <button
      onClick={handleRefresh}
      title="Refresh posts"
      className="p-2 rounded-lg transition-opacity hover:opacity-80"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="#8b92a5"
        className="w-4 h-4"
        style={{
          animation: spinning ? "spin 1s linear forwards" : "none",
        }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
        />
      </svg>
    </button>
  );
}