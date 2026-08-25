"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [accessCode, setAccessCode] = useState("");
  const localLogin=async(account:"maya"|"admin")=>{const response=await fetch("/api/auth/local",{method:"POST",headers:{"content-type":"application/json",...(accessCode?{"x-showout-pilot-code":accessCode}:{})},body:JSON.stringify({account})});const data=await response.json();if(response.ok)router.push(data.redirect);};
  return <main style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(0,1fr)" }}>
    <section style={{ padding: "25px clamp(18px,6vw,80px)", display: "grid", alignContent: "center", background: "var(--paper)" }}>
      <Link href="/" className="wordmark" style={{ position: "absolute", top: 25 }}>SHOWOUT<span className="dot"/></Link>
      <div style={{ width: "min(460px,100%)", margin: "70px auto 0" }}>
        <p className="eyebrow">Pilot access</p><h1 className="display-md">STEP INTO<br/>THE ARCADE.</h1>
        <p className="lede">No follower count. No popularity advantage. Just the work.</p>
        {sent ? <div className="notice"><strong>Check your email.</strong><br/>We sent a secure sign-in link to {email}. In this demo, use the local pilot login below.</div> :
          <form className="form-stack" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="maya@showout.test" autoComplete="email"/></div>
            <button className="button primary full" type="submit"><Mail size={17}/> Email me a sign-in link</button>
          </form>}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}><hr style={{ flex: 1, border: 0, borderTop: "1px solid" }}/><small>LOCAL PILOT</small><hr style={{ flex: 1, border: 0, borderTop: "1px solid" }}/></div>
        <div className="field" style={{marginBottom:12}}><label htmlFor="pilot-code">Pilot access code <span className="muted">(hosted pilot only)</span></label><input id="pilot-code" type="password" value={accessCode} onChange={e=>setAccessCode(e.target.value)} placeholder="Leave blank in local development" autoComplete="one-time-code"/></div>
        <button className="button ink full" onClick={() => localLogin("maya")}>Continue as Maya <ArrowRight size={17}/></button>
        <button className="button ghost full" style={{marginTop:8}} onClick={() => localLogin("admin")}>Pilot operator demo</button>
        <p className="muted" style={{ fontSize: ".7rem", lineHeight: 1.5 }}>Seed-account login is development-only unless a hosted pilot is explicitly protected by PILOT_ACCESS_CODE. Public production authentication still requires magic links or OTP.</p>
      </div>
    </section>
  </main>;
}
