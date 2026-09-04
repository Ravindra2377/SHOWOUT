"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { inbox } from "@/lib/demo-data";

function eligibilityFor(item: any) {
  // Demo data eligibility approximation
  if (item.kind === "request") return "REQUEST";
  if (item.kind === "team") return "ACTIVE";
  // For messages: check if they share challenge/team
  return "ACTIVE";
}

export default function InboxPage() {
  const [tab, setTab] = useState<"chats" | "requests" | "teams">("chats");

  return (
    <div className="page-narrow">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          marginBottom: 20,
        }}
      >
        <div>
          <p className="eyebrow">Controlled connections</p>
          <h1 className="display-sm">INBOX.</h1>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button className="icon-button" aria-label="Search inbox">
            <Search size={17} />
          </button>
          <Link
            className="icon-button"
            href="/settings/messaging"
            aria-label="Messaging controls"
          >
            <SlidersHorizontal size={17} />
          </Link>
        </div>
      </header>

      <nav
        className="tabs"
        aria-label="Inbox sections"
        style={{ display: "flex", gap: 12, marginBottom: 16 }}
      >
        <Link
          className={tab === "chats" ? "active" : ""}
          href="/inbox?tab=chats"
          style={{ flex: 1 }}
        >
          Messages <span className="badge">{inbox.filter(
            (x: any) => x.kind !== "request" && eligibilityFor(x) === "ACTIVE"
          ).length}</span>
        </Link>
        <Link
          className={tab === "requests" ? "active" : ""}
          href="/inbox?tab=requests"
          style={{ flex: 1 }}
        >
          Requests <strong>{inbox.filter((x: any) => x.kind === "request")
            .length}</strong>
        </Link>
        <Link
          className={tab === "teams" ? "active" : ""}
          href="/inbox?tab=teams"
          style={{ flex: 1 }}
        >
          Team conversations
        </Link>
      </nav>

      <div className="inbox-list">
        {tab === "chats" && (
          inbox
            .filter(
              (x: any) =>
                x.kind !== "request" && eligibilityFor(x) === "ACTIVE"
            )
            .map((item: any) => (
              <Link
                className="inbox-item"
                href={`/messages/${item.id}`}
                key={item.id}
              >
                <img src={item.avatar} alt="" />
                <div style={{ minWidth: 0 }}>
                  <h3>
                    {item.displayName} <span className="muted">@{item.handle}</span>
                  </h3>
                  <p>{item.preview}</p>
                  <small>{item.context}</small>
                </div>
                <div className="inbox-meta">{item.time}{item.unread > 0 && (
                  <span className="unread-count">{item.unread}</span>
                )}</div>
              </Link>
            ))
        )}

        {tab === "requests" && (
          inbox
            .filter((x: any) => x.kind === "request")
            .map((item: any) => (
              <Link
                className="inbox-item"
                href={`/inbox/requests/${item.id}`}
                key={item.id}
              >
                <img
                  src={item.avatar}
                  alt=""
                  style={{ width: 50, height: 50, objectFit: "cover", border: "var(--rule)" }}
                />
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0 }}>{item.displayName}</h2>
                  <p style={{ margin: "3px 0" }}>@{item.handle}</p>
                  <span className="status">New request</span>
                </div>
              </Link>
            ))
        )}

        {tab === "teams" && (
          inbox
            .filter((x: any) => x.kind === "team")
            .map((item: any) => (
              <Link
                className="inbox-item"
                href={`/team/${item.id}`}
                key={item.id}
              >
                <img src={item.avatar} alt="" />
                <div style={{ minWidth: 0 }}>
                  <h3>
                    {item.displayName} <span className="muted">@{item.handle}</span>
                  </h3>
                  <p>{item.preview}</p>
                  <small>{item.context}</small>
                </div>
                <div className="inbox-meta">{item.time}</div>
              </Link>
            ))
        )}
      </div>

      <div
        className="notice"
        style={{ marginTop: 22, fontSize: 12 }}
      >
        Inbox activity is intentionally quiet: no online status, streaks, or read receipts.
        Contact is limited by shared work and your messaging settings.
      </div>
    </div>
  );
}
