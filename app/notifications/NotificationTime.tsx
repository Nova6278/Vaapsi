"use client";

export default function NotificationTime({ createdAt }: { createdAt: string }) {
  return (
    <span className="text-xs shrink-0" style={{ color: '#4a5068' }}>
      {new Date(createdAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
      })}
    </span>
  );
}