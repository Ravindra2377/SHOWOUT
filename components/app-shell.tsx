"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Radio, Plus, UserRound, Inbox, Settings } from "lucide-react";

const nav = [
  { href: "/arcade", label: "Arcade", icon: Gamepad2 },
  { href: "/stage", label: "Stage", icon: Radio },
  { href: "/challenge/one-room-one-minute-one-thriller/submit", label: "Create", icon: Plus, create: true },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/u/maya.makes", label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const immersive = path.startsWith("/login") || path.startsWith("/onboarding") || path === "/";
  if (immersive) return <>{children}</>;
  return <div className="app-shell">
    <header className="site-header">
      <Link href="/arcade" className="wordmark" aria-label="SHOWOUT home">SHOWOUT<span className="dot" /></Link>
      <nav className="desktop-nav" aria-label="Primary">
        {nav.map(({ href, label }) => <Link key={href} href={href} aria-current={path.startsWith(href.split("/").slice(0,2).join("/")) ? "page" : undefined}>{label}</Link>)}
      </nav>
      <div className="header-actions">
        <Link className="icon-button" href="/inbox" aria-label="Inbox, 2 unread"><Inbox size={19}/><span className="unread-dot">2</span></Link>
        <Link className="icon-button" href="/settings" aria-label="Settings"><Settings size={19}/></Link>
      </div>
    </header>
    <main>{children}</main>
    <nav className="mobile-nav" aria-label="Primary">
      {nav.map(({ href, label, icon: Icon, create }) => <Link className={create ? "create-nav" : ""} key={href} href={href} aria-current={path === href ? "page" : undefined}><Icon size={create ? 25 : 20}/><span>{label}</span>{label === "Inbox" && <span className="unread-dot">2</span>}</Link>)}
    </nav>
  </div>;
}
