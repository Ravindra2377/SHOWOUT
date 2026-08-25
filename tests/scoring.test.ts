import { describe, expect, it } from "vitest";
import { normalizedScore, validateScores } from "@/lib/domain/scoring";
describe("normalized community scoring",()=>{
  it("requires enough votes",()=>expect(normalizedScore([{originality:5,execution:5,entertainment:5}],3)).toBeNull());
  it("shrinks a valid sample toward the neutral prior",()=>expect(normalizedScore(Array.from({length:3},()=>({originality:5,execution:5,entertainment:5})),3)).toBe(4));
  it("rejects fractional and out-of-range dimensions",()=>{expect(validateScores({originality:1,execution:5,entertainment:3})).toBe(true);expect(validateScores({originality:0,execution:5,entertainment:3})).toBe(false);expect(validateScores({originality:2.5,execution:5,entertainment:3})).toBe(false);});
});
