import Link from "next/link";
import { Search, MessageSquare, Settings } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="page-narrow">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 20 }}>
        <div>
          <p className="eyebrow">Messages</p>
          <h1 className="display-sm">Chats.</h1>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button className="icon-button" aria-label="Search messages">
            <Search size={17} />
          </button>
          <Link className="icon-button" href="/settings/messaging" aria-label="Messaging controls">
            <Settings size={17} />
          </Link>
        </div>
      </header>

      <div className="notice" style={{ marginTop: 22, fontSize: 12 }}>
        Your message threads will appear here. Start by sending a message request or accepting an existing one.
      </div>
    </div>
  );
}
