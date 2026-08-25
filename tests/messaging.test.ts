import { describe, expect, it } from "vitest";
import { messagingEligibility } from "@/lib/domain/messaging";
const base={mutualConnection:false,sharedChallenge:false,sharedTeam:false,acceptedRequest:false,pilotEnabled:false,blocked:false,priorDecline:false,senderAgeBand:"18_24" as const,recipientAgeBand:"18_24" as const};
describe("controlled direct messaging",()=>{
  it("activates for a shared challenge or team",()=>{expect(messagingEligibility({...base,sharedChallenge:true})).toBe("ACTIVE");expect(messagingEligibility({...base,sharedTeam:true})).toBe("ACTIVE");});
  it("permits only a request without prior context",()=>expect(messagingEligibility(base)).toBe("REQUEST"));
  it("denies recreation after decline and all contact after block",()=>{expect(messagingEligibility({...base,priorDecline:true})).toBe("DENIED");expect(messagingEligibility({...base,blocked:true,sharedTeam:true})).toBe("DENIED");});
  it("denies arbitrary adult-to-minor requests but permits approved context",()=>{const minor={...base,recipientAgeBand:"16_17" as const};expect(messagingEligibility(minor)).toBe("DENIED");expect(messagingEligibility({...minor,sharedChallenge:true})).toBe("ACTIVE");});
});
