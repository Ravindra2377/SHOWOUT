import Link from "next/link";
import { ArrowRight, EyeOff, Trophy, Timer } from "lucide-react";

export default function Landing() {
  return <main style={{ minHeight: "100vh", display: "grid", background: "var(--red)" }}>
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: "100vh", padding: "24px clamp(18px,5vw,70px)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", borderBottom: "var(--rule)", paddingBottom: 16 }}>
        <span className="wordmark" style={{ fontSize: "2rem" }}>SHOWOUT<span className="dot" style={{ background: "var(--lime)" }}/></span>
        <span className="eyebrow" style={{ alignSelf: "center" }}>Pilot 01</span>
      </header>
      <section style={{ alignSelf: "center", padding: "50px 0" }}>
        <p className="stamp">THE TALENT ARCADE</p>
        <h1 className="display" style={{ maxWidth: 1000 }}>DON&apos;T<br/>SCROLL.<br/><span style={{ color: "var(--paper)" }}>SHOW OUT.</span></h1>
        <p className="lede" style={{ maxWidth: 520 }}>One brief. Same constraints. Anonymous voting. A body of work that proves what you can do.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 28 }}>
          <Link href="/login" className="button ink">Enter the pilot <ArrowRight size={17}/></Link>
          <Link href="/arcade" className="button ghost">Explore Arcade</Link>
        </div>
      </section>
      <footer style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "var(--rule)", paddingTop: 14, gap: 10 }}>
        <span className="eyebrow"><Timer size={16}/> Create</span><span className="eyebrow"><EyeOff size={16}/> Reveal</span><span className="eyebrow"><Trophy size={16}/> Proof</span>
      </footer>
    </div>
  </main>;
}
