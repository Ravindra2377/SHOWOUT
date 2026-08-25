import { describe, expect, it } from "vitest";
import { deriveChallengeState } from "@/lib/domain/lifecycle";
const at=(minute:number)=>new Date(`2026-01-01T00:${String(minute).padStart(2,"0")}:00.000Z`);
const dates={published:true,opensAt:at(10),submissionClosesAt:at(20),revealOpensAt:at(30),votingClosesAt:at(40),settlesAt:at(50)};
describe("server challenge lifecycle",()=>{
  it("uses exact half-open deadline boundaries",()=>{expect(deriveChallengeState(dates,at(9))).toBe("UPCOMING");expect(deriveChallengeState(dates,at(10))).toBe("OPEN");expect(deriveChallengeState(dates,at(20))).toBe("SUBMISSION_CLOSED");expect(deriveChallengeState(dates,at(30))).toBe("REVEAL_LIVE");expect(deriveChallengeState(dates,at(40))).toBe("VOTING_CLOSED");expect(deriveChallengeState(dates,at(50))).toBe("SETTLED");});
  it("keeps unpublished and archived challenges controlled",()=>{expect(deriveChallengeState({...dates,published:false},at(35))).toBe("DRAFT");expect(deriveChallengeState({...dates,archived:true},at(35))).toBe("ARCHIVED");});
});
