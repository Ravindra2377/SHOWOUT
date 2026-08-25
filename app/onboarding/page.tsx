"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, EyeOff, Sparkles, Trophy } from "lucide-react";

const skills = ["Acting","Animation","Cinematography","Comedy","Dance","Design","Direction","Editing","Music","Sound Design","Storytelling","Writing"];
export default function OnboardingPage() {
  const [step,setStep]=useState(0); const [selected,setSelected]=useState<string[]>(["Direction","Editing"]); const router=useRouter();
  const toggle=(skill:string)=>setSelected(current=>current.includes(skill)?current.filter(x=>x!==skill):current.length<5?[...current,skill]:current);
  return <main className="page-narrow" style={{ minHeight: "100vh" }}>
    <header style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:35 }}><span className="wordmark">SHOWOUT<span className="dot"/></span><span className="stamp">{step+1} / 3</span></header>
    <div className="progress-track" aria-label={`Step ${step+1} of 3`}><div className="progress-fill" style={{width:`${(step+1)*33.33}%`}}/></div>
    {step===0&&<section style={{paddingTop:35}}><p className="eyebrow">How it works</p><h1 className="display-md">THE WORK<br/>GOES FIRST.</h1><div className="programme" style={{marginTop:30}}>{[
      ["01","Enter","Take on the same brief and constraints."],["02","Create","Make something original before time runs out."],["03","Reveal","Vote without knowing who made the entry."],["04","Build proof","Every completed challenge strengthens your profile."],
    ].map(([n,t,d],i)=><div className="programme-row" key={n}><strong className="programme-time">{n}</strong><div><h3>{t}</h3><p>{d}</p></div>{i===0?<Sparkles/>:i===2?<EyeOff/>:i===3?<Trophy/>:<Check/>}</div>)}</div></section>}
    {step===1&&<section style={{paddingTop:35}}><p className="eyebrow">Your player card</p><h1 className="display-sm">WHO&apos;S<br/>SHOWING OUT?</h1><div className="form-stack" style={{marginTop:28}}><div className="field"><label htmlFor="handle">Unique handle</label><input id="handle" defaultValue="maya.makes" required/><small>Letters, numbers and periods. You can change this later.</small></div><div className="field"><label htmlFor="name">Display name</label><input id="name" defaultValue="Maya Sen" required/></div><div className="field"><label htmlFor="bio">Short bio</label><textarea id="bio" defaultValue="Director and editor making tiny films with oversized tension." maxLength={240}/></div><div className="field"><label htmlFor="age">Age band</label><select id="age" defaultValue="18_24"><option value="13_15">13–15</option><option value="16_17">16–17</option><option value="18_24">18–24</option><option value="25_34">25–34</option><option value="35_PLUS">35+</option></select><small>Your exact age is never public.</small></div></div></section>}
    {step===2&&<section style={{paddingTop:35}}><p className="eyebrow">Choose up to five</p><h1 className="display-sm">WHAT DO<br/>YOU MAKE?</h1><p className="lede">This tunes your starting Arcade. Proven skills will come from completed challenges.</p><div className="chip-row" style={{marginTop:28}}>{skills.map(skill=><button key={skill} type="button" onClick={()=>toggle(skill)} className="button" style={{minHeight:42,background:selected.includes(skill)?"var(--lime)":"var(--white)"}}>{selected.includes(skill)&&<Check size={14}/>} {skill}</button>)}</div><p className="muted" style={{fontSize:12}}>{selected.length} of 5 selected</p></section>}
    <footer style={{display:"grid",gridTemplateColumns:step?"1fr 2fr":"1fr",gap:9,marginTop:35}}>{step>0&&<button className="button ghost" onClick={()=>setStep(step-1)}><ArrowLeft size={16}/>Back</button>}<button className="button primary" onClick={()=>step<2?setStep(step+1):router.push("/arcade")}>{step<2?"Continue":"Enter the Arcade"}<ArrowRight size={16}/></button></footer>
  </main>;
}
