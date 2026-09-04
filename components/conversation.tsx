"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal, Check, X, Flag, Plus, Send } from "lucide-react";
import { currentUser } from "@/lib/server/auth";
import { messagingEligibility } from "@/lib/domain/messaging";
import { inbox, messages as initial } from "@/lib/demo-data";

function useConversationEligibility(conversationId: string) {
  const [state, setState] = useState<"ACTIVE" | "REQUEST" | "DENIED">("ACTIVE");
  useEffect(() => {
    const check = async () => {
      const user = await currentUser();
      if (!user) return setState("DENIED");
      const person = inbox.find((x: any) => x.id === conversationId) || inbox[0];
      const context = {
        mutualConnection: person.mutualConnection ?? false,
        sharedChallenge: person.sharedChallenge ?? false,
        sharedTeam: person.sharedTeam ?? false,
        acceptedRequest: person.acceptedRequest ?? false,
        pilotEnabled: person.pilotEnabled ?? false,
        blocked: false,
        priorDecline: false,
        senderAgeBand: user.ageBand,
        recipientAgeBand: person.ageBand ?? "18_24",
      };
      setState(messagingEligibility(context));
    };
    check();
  }, [conversationId]);
  return state;
}

export function Conversation({id}:{id:string}) {
  const person = inbox.find((x: any) => x.id === id) ?? inbox[0];
  const eligibility = useConversationEligibility(id);
  const [messages, setMessages] = useState(initial);
  const [body, setBody] = useState("");
  const [pendingDecision, setPendingDecision] = useState<string | null>(null);

  const send = () => {
    const clean = body.trim().slice(0, 1500);
    if (!clean) return;
    setMessages([...messages, { id: crypto.randomUUID(), mine: true, body: clean, time: "now" }]);
    setBody("");
  };

  const renderComposer = () => {
    if (eligibility === "ACTIVE") {
      return (
        <div className="composer">
          <button className="icon-button" aria-label="Share challenge, Proof or team invitation">
            <Plus size={19} />
          </button>
          <input
            value={body}
            maxLength={1500}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            aria-label="Message"
            placeholder="Write a message…"
          />
          <button
            className="icon-button"
            style={{ background: "var(--red)" }}
            onClick={send}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      );
    }
    if (eligibility === "REQUEST") {
      return (
        <div style={{ padding: 12, borderTop: "1px solid var(--border)", marginTop: 12 }}>
          <p className="muted" style={{ margin: "8px 0" }}>
            Message request sent. waiting for {person.displayName} to accept.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button className="button lime" onClick={() => setPendingDecision("Accepted")}>
              <Check size={15} /> Accept
            </button>
            <button className="button" onClick={() => setPendingDecision("Declined")}>
              <X size={15} /> Decline
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-narrow conversation-page">
      <header className="conversation-head">
        <Link className="icon-button" href="/inbox" aria-label="Back to inbox">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <strong>{person.displayName}</strong>
          <br />
          <small>@{person.handle} · {person.context}</small>
        </div>
        <button className="icon-button" aria-label="Conversation actions: mute, leave, block or report">
          <MoreHorizontal size={18} />
        </button>
      </header>
      <div className="message-list" aria-live="polite">
        <button className="button ghost" style={{ alignSelf: "center", minHeight: 36 }}>
          Load older messages
        </button>
        <div className="notice" style={{ alignSelf: "center", fontSize: 11 }}>
          Messaging unlocked by shared challenge participation. Keep it constructive.
        </div>
        {messages.map((message: any) => (
          <div className={`message ${message.mine ? "mine" : ""}`} key={message.id}>
            <p>{message.body}</p>
            {"reaction" in message && message.reaction && (
              <span className="stamp" style={{ marginTop: 7 }}>
                {message.reaction}
              </span>
            )}
            <time>{message.time}</time>
          </div>
        ))}
      </div>
      {renderComposer()}
      {eligibility === "REQUEST" && pendingDecision !== null ? (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <p className="muted" style={{ marginBottom: 8 }}>
            {pendingDecision === "Accepted"
              ? "Your request was accepted! You can now message."
              : "Declined. You won't receive further requests from this person."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
