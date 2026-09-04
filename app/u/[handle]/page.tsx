import Link from "next/link";
import { Flag, MessageSquare, ShieldOff, UserPlus } from "lucide-react";
import { maya } from "@/lib/demo-data";
import { currentUser } from "@/lib/server/auth";
import { messagingEligibility } from "@/lib/domain/messaging";

export default async function ProfilePage({params}:{params:Promise<{handle: string}>}) {
  const {handle} = await params;
  const own = handle === maya.handle;
  const user = await currentUser();

  const context = {
    mutualConnection: false,
    sharedChallenge: false,
    sharedTeam: false,
    acceptedRequest: false,
    pilotEnabled: false,
    blocked: false,
    priorDecline: false,
    senderAgeBand: user?.ageBand ?? "18_24",
    recipientAgeBand: maya.ageBand ?? "18_24",
  };

  const eligibility = own ? "ACTIVE" : messagingEligibility(context);

  return (
    <div className="page">
      <header className="profile-mast">
        <img className="profile-avatar" src={maya.avatar} alt={`${maya.displayName}'s avatar`}/>
        <div>
          <span className="stamp">PROOF PLAYER / 0218</span>
          <h1 className="display-md" style={{marginTop:12}}>{maya.displayName}</h1>
          <p style={{fontWeight:800,margin:"5px 0"}}>@{maya.handle}</p>
          <p className="lede" style={{marginBottom:12}}>{maya.bio}</p>
          <div className="chip-row">
            {maya.roles.map((x: any, i: number) => (
              <span className="chip" key={x}>{x}</span>
            ))}
          </div>

          {!own && (
            <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
              {eligibility === "ACTIVE" && (
                <>
                  <Link className="button" href="/messages/conv-maya">
                    <MessageSquare size={15} /> Message
                  </Link>
                  <button className="button primary">
                    <UserPlus size={15} /> Connect
                  </button>
                </>
              )}
              {eligibility === "REQUEST" && (
                <p className="muted" style={{marginBottom:8,fontSize:12}}>
                  Message request sent. Waiting for {maya.displayName} to accept.
                </p>
              )}
              {eligibility === "DENIED" && (
                <p className="muted" style={{marginBottom:8,fontSize:12,color:"var(--red)"}}>
                  Messaging is not permitted for this user.
                </p>
              )}
              <button className="icon-button" aria-label="Report user">
                <Flag size={16} />
              </button>
              <button className="icon-button" aria-label="Block user">
                <ShieldOff size={16} />
              </button>
            </div>
          )}

          {own && (
            <div style={{marginTop:16}}>
              <p className="muted" style={{fontSize:12}}>
                Your profile settings
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="profile-stats">
        <div><strong>{maya.challenges}</strong><span>Challenges</span></div>
        <div><strong>{maya.communityPicks}</strong><span>Community Picks</span></div>
        <div><strong>{maya.judgePicks}</strong><span>Judge Picks</span></div>
      </div>

      <section>
        <div className="section-head">
          <h2>Proven skills</h2>
          <span className="status">Derived from Proof</span>
        </div>
        {maya.skills.map((skill: any, i: number) => (
          <div className="skill-row" key={skill.name}>
            <span>{skill.name}</span>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{width:`${88-i*14}%`,background:i===0?"var(--blue)":"var(--red)"}}
              />
            </div>
            <span>{skill.proofs}</span>
          </div>
        ))}
        <p className="muted" style={{fontSize:12}}>
          Completion rate: <strong>{maya.completionRate}%</strong> ·
          Stats settle only from approved challenge records.
        </p>
      </section>

      <section>
        <div className="section-head">
          <h2>Recent Proof</h2>
          <span>{maya.proofs.length} of {maya.challenges}</span>
        </div>
      </section>
    </div>
  );
}
