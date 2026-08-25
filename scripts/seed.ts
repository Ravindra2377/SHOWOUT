import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  challengeRules, challenges, entries, mediaAssets, normalizedResults, profileProofs,
  profiles, termsVersions, users,
} from "../db/schema";
const sql = postgres(process.env.DATABASE_URL ?? "postgres://showout:showout@localhost:5433/showout", { max: 1, prepare: false });
const db = drizzle(sql);

const ids = {
  maya: "11111111-1111-4111-8111-111111111111",
  niko: "22222222-2222-4222-8222-222222222222",
  ama: "33333333-3333-4333-8333-333333333333",
  jules: "44444444-4444-4444-8444-444444444444",
  rio: "55555555-5555-4555-8555-555555555555",
  admin: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  c39: "39000000-0000-4000-8000-000000000039",
  c41: "41000000-0000-4000-8000-000000000041",
  c42: "42000000-0000-4000-8000-000000000042",
  c43: "43000000-0000-4000-8000-000000000043",
  c44: "44000000-0000-4000-8000-000000000044",
  term: "11000000-0000-4000-8000-000000000011",
};
const day = 86_400_000;
const at = (days: number) => new Date(Date.now() + days * day);

const people = [
  { id: ids.maya, email: "maya@showout.test", role: "USER" as const, ageBand: "18_24" as const, handle: "maya.makes", displayName: "Maya Sen", bio: "Director and editor making tiny films with oversized tension." },
  { id: ids.niko, email: "niko@showout.test", role: "USER" as const, ageBand: "18_24" as const, handle: "niko.cut", displayName: "Niko Alvarez", bio: "Editor and sound designer. Cuts first, talks later." },
  { id: ids.ama, email: "ama@showout.test", role: "USER" as const, ageBand: "18_24" as const, handle: "ama.sings", displayName: "Ama Okafor", bio: "Singer and field-recording collector." },
  { id: ids.jules, email: "jules@showout.test", role: "USER" as const, ageBand: "18_24" as const, handle: "jules.frames", displayName: "Jules Park", bio: "Cinematographer chasing strange practical light." },
  { id: ids.rio, email: "rio@showout.test", role: "USER" as const, ageBand: "25_34" as const, handle: "rio.moves", displayName: "Rio Costa", bio: "Animator and practical-effects maker." },
  { id: ids.admin, email: "pilot.admin@showout.test", role: "ADMIN" as const, ageBand: "25_34" as const, handle: "pilot.operator", displayName: "Pilot Operator", bio: "SHOWOUT pilot operations." },
];
async function main() {
for (const person of people) {
  await db.insert(users).values({ id: person.id, email: person.email, role: person.role, ageBand: person.ageBand }).onConflictDoUpdate({ target: users.id, set: { email: person.email, role: person.role, ageBand: person.ageBand, updatedAt: new Date() } });
  await db.insert(profiles).values({ userId: person.id, handle: person.handle, displayName: person.displayName, bio: person.bio }).onConflictDoUpdate({ target: profiles.userId, set: { handle: person.handle, displayName: person.displayName, bio: person.bio, updatedAt: new Date() } });
}

const challengeSeed = [
  { id: ids.c39, number: 39, slug: "light-after-midnight", title: "LIGHT AFTER MIDNIGHT", brief: "Make darkness perform.", description: "A settled pilot challenge.", state: "SETTLED" as const, dates: [-20,-16,-15,-13,-12], maxDurationSeconds: 45, maxBytes: 150_000_000, rules: ["Maximum 45 seconds", "One practical light source", "No day-for-night"] },
  { id: ids.c41, number: 41, slug: "the-perfect-loop", title: "THE PERFECT LOOP.", brief: "Hide the ending inside the beginning.", description: "Build a seamless visual loop whose final frame changes how the first frame feels.", state: "REVEAL_LIVE" as const, dates: [-9,-3,-2,2,3], maxDurationSeconds: 30, maxBytes: 150_000_000, rules: ["Maximum 30 seconds", "Seamless visual loop", "No stock footage"] },
  { id: ids.c42, number: 42, slug: "one-room-one-minute-one-thriller", title: "ONE ROOM. ONE MINUTE. ONE THRILLER.", brief: "Make a thriller in one room.", description: "Turn one ordinary room into sixty seconds nobody can look away from. Tension over budget.", state: "OPEN" as const, dates: [-2,3,4,6,7], maxDurationSeconds: 60, maxBytes: 250_000_000, rules: ["Maximum 60 seconds", "One visible character", "No spoken dialogue"] },
  { id: ids.c43, number: 43, slug: "sound-before-picture", title: "SOUND BEFORE PICTURE.", brief: "Tell the story with your eyes closed.", description: "Build a complete emotional turn using field recording, voice, foley and silence.", state: "OPEN" as const, dates: [-1,5,6,8,9], maxDurationSeconds: 45, maxBytes: 100_000_000, rules: ["Maximum 45 seconds", "Original recorded audio", "Picture may be black"] },
  { id: ids.c44, number: 44, slug: "make-it-move", title: "MAKE IT MOVE.", brief: "Animate one overlooked object.", description: "Give a household object a motive, a problem and a memorable exit.", state: "UPCOMING" as const, dates: [3,9,10,12,13], maxDurationSeconds: 30, maxBytes: 150_000_000, rules: ["Maximum 30 seconds", "One hero object", "Any animation technique"] },
];
const covers: Record<number,string> = { 39: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23", 41: "https://images.unsplash.com/photo-1536240478700-b869070f9279", 42: "https://images.unsplash.com/photo-1485846234645-a62644f84728", 43: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc", 44: "https://images.unsplash.com/photo-1577083552431-6e5fd01988a5" };
for (const item of challengeSeed) {
  const [opensAt, submissionClosesAt, revealOpensAt, votingClosesAt, settlesAt] = item.dates.map(at) as [Date,Date,Date,Date,Date];
  const values = { id: item.id, number: item.number, slug: item.slug, title: item.title, brief: item.brief, description: item.description, state: item.state, opensAt, submissionClosesAt, revealOpensAt, votingClosesAt, settlesAt, maxDurationSeconds: item.maxDurationSeconds, maxBytes: item.maxBytes, acceptedMimeTypes: ["video/mp4", "video/webm", "video/quicktime"], judgingDimensions: ["Originality", "Execution", "Entertainment"], published: true, coverKey: covers[item.number], createdBy: ids.admin };
  await db.insert(challenges).values(values).onConflictDoUpdate({ target: challenges.id, set: { ...values, updatedAt: new Date() } });
  await db.delete(challengeRules).where(eq(challengeRules.challengeId, item.id));
  await db.insert(challengeRules).values(item.rules.map((text, position) => ({ challengeId: item.id, position, text })));
}

await db.insert(termsVersions).values({ id: ids.term, kind: "CONTENT_RIGHTS", version: "1.1", readableText: "You keep ownership. You grant SHOWOUT a narrow, revocable license to display this Entry for this Challenge, its Reveal, results, moderation, and your Proof profile.", effectiveAt: at(-30) }).onConflictDoUpdate({ target: termsVersions.id, set: { readableText: "You keep ownership. You grant SHOWOUT a narrow, revocable license to display this Entry for this Challenge, its Reveal, results, moderation, and your Proof profile." } });

const videoUrls = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
];
const creators = [ids.maya, ids.ama, ids.jules, ids.rio];
for (let index = 0; index < creators.length; index++) {
  const mediaId = `41000000-1000-4000-8000-00000000000${index + 1}`;
  const entryId = `41000000-2000-4000-8000-00000000000${index + 1}`;
  await db.insert(mediaAssets).values({ id: mediaId, ownerId: creators[index]!, objectKey: videoUrls[index]!, mimeType: "video/mp4", bytes: 5_000_000, durationSeconds: 24 + index, status: "READY" }).onConflictDoNothing();
  await db.insert(entries).values({ id: entryId, challengeId: ids.c41, creatorId: creators[index]!, mediaAssetId: mediaId, caption: "A loop built from one practical transition.", status: "SUBMITTED", moderationStatus: "APPROVED", submittedAt: at(-3), lockedAt: at(-3), idempotencyKey: `seed-loop-${index}` }).onConflictDoNothing();
}

const proofMedia = "39000000-1000-4000-8000-000000000001";
const proofEntry = "39000000-2000-4000-8000-000000000001";
await db.insert(mediaAssets).values({ id: proofMedia, ownerId: ids.maya, objectKey: `?proof=39`, mimeType: "video/mp4", bytes: 4_000_000, durationSeconds: 41, status: "READY" }).onConflictDoNothing();
await db.insert(entries).values({ id: proofEntry, challengeId: ids.c39, creatorId: ids.maya, mediaAssetId: proofMedia, caption: "One lamp. One decision.", status: "APPROVED", moderationStatus: "APPROVED", submittedAt: at(-16), lockedAt: at(-16), idempotencyKey: "seed-proof-maya-39" }).onConflictDoNothing();
await db.insert(normalizedResults).values({ entryId: proofEntry, challengeId: ids.c39, originality: 4.8, execution: 4.6, entertainment: 4.7, normalizedScore: 4.72, eligibleVoteCount: 9, communityPick: true, judgePick: false, settledAt: at(-12) }).onConflictDoUpdate({ target: normalizedResults.entryId, set: { normalizedScore: 4.72, eligibleVoteCount: 9, communityPick: true, settledAt: at(-12) } });
await db.insert(profileProofs).values({ userId: ids.maya, entryId: proofEntry, challengeId: ids.c39, role: "Director + Editor" }).onConflictDoNothing();

for (let index = 0; index < 17; index++) {
  const number = 20 + index;
  const prefix = `${number}000000`;
  const challengeId = `${prefix}-0000-4000-8000-${String(number).padStart(12, "0")}`;
  const mediaId = `${prefix}-1000-4000-8000-${String(index + 1).padStart(12, "0")}`;
  const entryId = `${prefix}-2000-4000-8000-${String(index + 1).padStart(12, "0")}`;
  const title = ["A QUIET EXIT", "THREE BLUE SHADOWS", "CUT ON BREATH", "THE BORROWED HOUR", "OBJECTS REMEMBER"][index % 5]!;
  await db.insert(challenges).values({ id: challengeId, number, slug: `proof-${number}`, title, brief: "A completed SHOWOUT brief.", description: "Settled pilot Proof used to demonstrate an evidence-based creator profile.", state: "SETTLED", opensAt: at(-90 + index), submissionClosesAt: at(-88 + index), revealOpensAt: at(-87 + index), votingClosesAt: at(-86 + index), settlesAt: at(-85 + index), maxDurationSeconds: 45, maxBytes: 150_000_000, acceptedMimeTypes: ["video/mp4"], judgingDimensions: ["Originality", "Execution", "Entertainment"], published: true, coverKey: `${covers[39]}?proof=${number}`, createdBy: ids.admin }).onConflictDoNothing();
  await db.insert(mediaAssets).values({ id: mediaId, ownerId: ids.maya, objectKey: `${videoUrls[index % videoUrls.length]}?proof=${number}`, mimeType: "video/mp4", bytes: 4_000_000 + index, durationSeconds: 24 + (index % 20), status: "READY" }).onConflictDoNothing();
  await db.insert(entries).values({ id: entryId, challengeId, creatorId: ids.maya, mediaAssetId: mediaId, caption: "Completed under the same brief and constraints.", status: "APPROVED", moderationStatus: "APPROVED", submittedAt: at(-88 + index), lockedAt: at(-88 + index), idempotencyKey: `seed-proof-maya-${number}` }).onConflictDoNothing();
  await db.insert(normalizedResults).values({ entryId, challengeId, originality: 4.1 + (index % 5) / 10, execution: 4.2, entertainment: 4.3, normalizedScore: 4.2 + (index % 4) / 10, eligibleVoteCount: 7 + (index % 5), communityPick: index < 5, judgePick: index < 3, settledAt: at(-85 + index) }).onConflictDoNothing();
  await db.insert(profileProofs).values({ userId: ids.maya, entryId, challengeId, role: index % 2 ? "Editor" : "Director" }).onConflictDoNothing();
}

console.log(`SHOWOUT PostgreSQL seed ready: ${people.length} users, ${challengeSeed.length + 17} challenges, ${creators.length} anonymous Reveal entries.`);
await sql.end();

}
main().catch((error) => {
  console.error("SHOWOUT seed failed:", error);
  process.exitCode = 1;
});
