import Link from "next/link";
import type { Challenge } from "@/lib/types";

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const statusClass = challenge.state === "REVEAL_LIVE" ? "reveal" : challenge.state === "UPCOMING" ? "upcoming" : "";
  return <Link className="challenge-card" href={challenge.state === "REVEAL_LIVE" ? `/reveal/${challenge.slug}` : `/challenge/${challenge.slug}`}>
    <div className="cover" style={{ backgroundImage: `url(${challenge.cover})` }}><b>#{challenge.number}</b></div>
    <div className="copy"><span className={`status ${statusClass}`}>{challenge.state === "REVEAL_LIVE" ? "Reveal live" : challenge.state}</span><h3>{challenge.title}</h3><p>{challenge.brief}</p><div className="chip-row">{challenge.skills.slice(0,2).map(skill => <span className="chip" key={skill}>{skill}</span>)}</div></div>
  </Link>;
}
