import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { challenges } from "@/lib/demo-data";
import { Countdown } from "@/components/countdown";
import { ChallengeCard } from "@/components/challenge-card";

export const metadata: Metadata = { title: "Arcade" };
export default function ArcadePage() {
  const featured=challenges[0];
  return <div className="page">
    <div className="arcade-hero">
      <div className="hero-title-wrap"><p className="eyebrow">The talent arcade</p><h1 className="display">PROVE<br/>IT.</h1><span className="scribble">New drops. Fair starts.</span><span className="issue">MON 24 AUG / DROP 042</span></div>
      <article className="featured">
        <div className="featured-image" style={{backgroundImage:`url(${featured.cover})`}}><span className="featured-number">042</span></div>
        <div className="featured-copy"><span className="status">Open now · {featured.entryCount} entries locked</span><div><p className="eyebrow lime">Featured drop</p><h2>{featured.title}</h2></div><p style={{margin:0,opacity:.76}}>{featured.brief}</p><Countdown to={featured.submissionClosesAt} dark/><Link href={`/challenge/${featured.slug}`} className="button primary full">Enter Challenge <ArrowRight size={17}/></Link></div>
      </article>
    </div>
    <section><div className="section-head"><h2>Now in the Arcade</h2><span className="eyebrow"><CalendarDays size={14}/> Curated weekly</span></div><div className="challenge-grid">{challenges.slice(1).map(c=><ChallengeCard challenge={c} key={c.id}/>)}</div></section>
    <section style={{marginTop:44,border:"var(--rule)",padding:"24px",background:"var(--lime)",display:"grid",gap:10}}><p className="eyebrow">The SHOWOUT rule</p><h2 className="display-sm">IDENTITY<br/>WAITS OUTSIDE.</h2><p className="lede" style={{margin:0}}>During Reveal, names, avatars and social signals disappear. The work earns the first impression.</p></section>
  </div>;
}
