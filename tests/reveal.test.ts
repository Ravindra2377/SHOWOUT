import { describe, expect, it } from "vitest";
import { anonymousRevealPayload, mayVote } from "@/lib/domain/reveal";
describe("anonymous reveal integrity",()=>{
  it("omits creator identity from the serialized pre-vote payload",()=>{const payload=anonymousRevealPayload({assignmentId:"a",entryId:"e",position:1,total:5,videoUrl:"x",duration:20,creator:{handle:"secret",displayName:"Secret",avatar:"secret.jpg"}});expect(JSON.stringify(payload)).not.toMatch(/secret|creator|handle|avatar/i);});
  it("rejects self, team and duplicate voting",()=>{expect(mayVote({voterId:"u",creatorId:"u",voterTeamIds:[],alreadyVoted:false})).toBe(false);expect(mayVote({voterId:"u",creatorId:"v",voterTeamIds:["t"],creatorTeamId:"t",alreadyVoted:false})).toBe(false);expect(mayVote({voterId:"u",creatorId:"v",voterTeamIds:[],alreadyVoted:true})).toBe(false);expect(mayVote({voterId:"u",creatorId:"v",voterTeamIds:[],alreadyVoted:false})).toBe(true);});
});
