import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { entries, mediaAssets, votes, votingAssignments } from "@/db/schema";
import { db } from "@/lib/server/db";
import { POST as login } from "@/app/api/auth/local/route";
import { POST as uploadIntent } from "@/app/api/uploads/intent/route";
import { PUT as localUpload } from "@/app/api/uploads/local/[assetId]/route";
import { POST as submit } from "@/app/api/submissions/route";
import { GET as reveal } from "@/app/api/reveal/[slug]/route";
import { POST as lockVote } from "@/app/api/votes/route";
import { GET as media } from "@/app/api/media/[entryId]/route";
import { GET as ownProfile } from "@/app/api/profile/me/route";

const enabled = process.env.RUN_DB_TESTS === "1";
const ids = { maya: "11111111-1111-4111-8111-111111111111", niko: "22222222-2222-4222-8222-222222222222", c41: "41000000-0000-4000-8000-000000000041", c42: "42000000-0000-4000-8000-000000000042", mayaLoop: "41000000-2000-4000-8000-000000000001" };
async function token(account: "maya" | "voter") {
  const response = await login(new Request("http://localhost/api/auth/local", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ account }) }));
  expect(response.status).toBe(200);
  return (await response.json() as { token: string }).token;
}
const request = (url: string, bearer: string, init: RequestInit = {}) => new Request(`http://localhost${url}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${bearer}`, ...init.headers } });

describe.skipIf(!enabled)("persistent participant loop", () => {
  beforeEach(async () => {
    await db.delete(votes).where(eq(votes.voterId, ids.niko));
    await db.delete(votingAssignments).where(inArray(votingAssignments.voterId, [ids.niko, ids.maya]));
    const drafts = await db.select({ id: entries.id, mediaAssetId: entries.mediaAssetId }).from(entries).where(and(eq(entries.creatorId, ids.maya), eq(entries.challengeId, ids.c42)));
    if (drafts.length) await db.delete(entries).where(inArray(entries.id, drafts.map((entry) => entry.id)));
    const mediaIds = drafts.flatMap((entry) => entry.mediaAssetId ? [entry.mediaAssetId] : []);
    if (mediaIds.length) await db.delete(mediaAssets).where(inArray(mediaAssets.id, mediaIds));
  });
  afterEach(async () => { await db.delete(votes).where(eq(votes.voterId, ids.niko)); await db.delete(votingAssignments).where(inArray(votingAssignments.voterId, [ids.niko, ids.maya])); });

  it("uploads, submits idempotently, and protects media before Reveal", async () => {
    const maya = await token("maya");
    const niko = await token("voter");
    const intentResponse = await uploadIntent(request("/api/uploads/intent", maya, { method: "POST", body: JSON.stringify({ challengeSlug: "one-room-one-minute-one-thriller", mimeType: "video/mp4", bytes: 8, durationSeconds: 8 }) }));
    expect(intentResponse.status).toBe(201);
    const intent = await intentResponse.json() as { assetId: string; uploadUrl: string };
    const putResponse = await localUpload(new Request(`http://localhost${intent.uploadUrl}`, { method: "PUT", headers: { "content-type": "video/mp4" }, body: new Uint8Array([0,0,0,8,102,116,121,112]) }), { params: Promise.resolve({ assetId: intent.assetId }) });
    expect(putResponse.status).toBe(200);
    const payload = { challengeSlug: "one-room-one-minute-one-thriller", assetId: intent.assetId, caption: "The door moves only when the light goes out.", rulesAccepted: true, rightsTermsVersion: "1.1", idempotencyKey: `integration-${intent.assetId}`, aiMediaDisclosed: false };
    const first = await submit(request("/api/submissions", maya, { method: "POST", body: JSON.stringify(payload) }));
    expect(first.status).toBe(201);
    const submitted = await first.json() as { entryId: string; hidden: boolean };
    expect(submitted.hidden).toBe(true);
    const replay = await submit(request("/api/submissions", maya, { method: "POST", body: JSON.stringify(payload) }));
    expect(replay.status).toBe(200);
    const inaccessible = await media(request(`/api/media/${submitted.entryId}`, niko), { params: Promise.resolve({ entryId: submitted.entryId }) });
    expect(inaccessible.status).toBe(404);
  });

  it("persists balanced assignments, hides identity, and locks votes immutably", async () => {
    const niko = await token("voter");
    const response = await reveal(request("/api/reveal/the-perfect-loop", niko), { params: Promise.resolve({ slug: "the-perfect-loop" }) });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toMatch(/creatorId|handle|displayName|avatar|Maya Sen|maya\.makes/i);
    const payload = JSON.parse(text) as { assignments: Array<{ assignmentId: string; entryId: string; position: number }> };
    expect(payload.assignments.length).toBeGreaterThanOrEqual(3);
    expect(new Set(payload.assignments.map((assignment) => assignment.position)).size).toBe(payload.assignments.length);
    const assignment = payload.assignments[0]!;
    const body = JSON.stringify({ ...assignment, originality: 4, execution: 5, entertainment: 4, elapsedMs: 8200, deviceSignal: "integration-device" });
    const locked = await lockVote(request("/api/votes", niko, { method: "POST", body }));
    expect(locked.status, JSON.stringify(await locked.clone().json())).toBe(201);
    expect((await locked.json() as { creator: { handle: string } }).creator.handle).toBeTruthy();
    const duplicate = await lockVote(request("/api/votes", niko, { method: "POST", body }));
    expect(duplicate.status).toBe(409);
  });

  it("derives required profile statistics from settled results", async () => {
    const maya = await token("maya");
    const response = await ownProfile(request("/api/profile/me", maya));
    expect(response.status).toBe(200);
    const profile = (await response.json() as { profile: { challenges: number; communityPicks: number; judgePicks: number } }).profile;
    expect(profile).toMatchObject({ challenges: 18, communityPicks: 6, judgePicks: 3 });
  });

  it("rejects a self-vote even when an assignment is maliciously inserted", async () => {
    const maya = await token("maya");
    const [assignment] = await db.insert(votingAssignments).values({ challengeId: ids.c41, voterId: ids.maya, entryId: ids.mayaLoop, position: 99 }).returning();
    const response = await lockVote(request("/api/votes", maya, { method: "POST", body: JSON.stringify({ assignmentId: assignment!.id, entryId: ids.mayaLoop, originality: 5, execution: 5, entertainment: 5, elapsedMs: 9000 }) }));
    expect(response.status, JSON.stringify(await response.clone().json())).toBe(403);
  });
});
