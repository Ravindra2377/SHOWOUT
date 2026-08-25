"use client";
import { useEffect, useState } from "react";

export function Countdown({ to, dark = false }: { to: string; dark?: boolean }) {

  const [distance, setDistance] = useState(0);
  useEffect(() => { const tick = () => setDistance(Math.max(0, new Date(to).getTime() - Date.now())); const initial = window.setTimeout(tick, 0); const timer = window.setInterval(tick, 1000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [to]);
  const days = Math.floor(distance / 86_400_000); const hours = Math.floor(distance / 3_600_000) % 24;
  const minutes = Math.floor(distance / 60_000) % 60; const seconds = Math.floor(distance / 1000) % 60;
  return <div className="countdown" aria-label={`${days} days, ${hours} hours, ${minutes} minutes remaining`} style={dark ? { color: "white" } : undefined}>
    {[[days,"days"],[hours,"hours"],[minutes,"mins"],[seconds,"secs"]].map(([value,label]) => <div key={label}><strong>{String(value).padStart(2,"0")}</strong><span>{label}</span></div>)}
  </div>;
}
