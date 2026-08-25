import type { Challenge, InboxItem, PilotProfile, RevealEntry } from "./types";

const now = Date.now();
const day = 86_400_000;
const iso = (offset: number) => new Date(now + offset).toISOString();

export const challenges: Challenge[] = [
  {
    id: "c042", number: 42, slug: "one-room-one-minute-one-thriller", title: "ONE ROOM. ONE MINUTE. ONE THRILLER.",
    brief: "Make a thriller in one room.", description: "Turn one ordinary room into sixty seconds nobody can look away from. Tension over budget. Precision over spectacle.",
    state: "OPEN", opensAt: iso(-2 * day), submissionClosesAt: iso(2.4 * day), revealOpensAt: iso(3 * day), votingClosesAt: iso(5 * day), settlesAt: iso(6 * day),
    maxDurationSeconds: 60, maxBytes: 250_000_000, acceptedMimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    judgingDimensions: ["Originality", "Execution", "Entertainment"], rules: ["Maximum 60 seconds", "One visible character", "No spoken dialogue"],
    skills: ["Direction", "Editing", "Storytelling"], cover: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=85", accent: "red", entryCount: 38,
  },
  {
    id: "c043", number: 43, slug: "sound-before-picture", title: "SOUND BEFORE PICTURE.", brief: "Tell the story with your eyes closed.",
    description: "Build a complete emotional turn using field recording, voice, foley and silence.", state: "OPEN", opensAt: iso(-day), submissionClosesAt: iso(4 * day), revealOpensAt: iso(5 * day), votingClosesAt: iso(7 * day), settlesAt: iso(8 * day),
    maxDurationSeconds: 45, maxBytes: 100_000_000, acceptedMimeTypes: ["video/mp4", "video/webm"], judgingDimensions: ["Originality", "Execution", "Entertainment"],
    rules: ["Maximum 45 seconds", "Original recorded audio", "Picture may be black"], skills: ["Sound Design", "Storytelling"], cover: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=85", accent: "blue", entryCount: 21,
  },
  {
    id: "c044", number: 44, slug: "make-it-move", title: "MAKE IT MOVE.", brief: "Animate one overlooked object.",
    description: "Give a household object a motive, a problem and a memorable exit.", state: "UPCOMING", opensAt: iso(3 * day), submissionClosesAt: iso(9 * day), revealOpensAt: iso(10 * day), votingClosesAt: iso(12 * day), settlesAt: iso(13 * day),
    maxDurationSeconds: 30, maxBytes: 150_000_000, acceptedMimeTypes: ["video/mp4", "video/webm"], judgingDimensions: ["Originality", "Execution", "Entertainment"],
    rules: ["Maximum 30 seconds", "One hero object", "Any animation technique"], skills: ["Animation", "Art Direction"], cover: "https://images.unsplash.com/photo-1577083552431-6e5fd01988a5?auto=format&fit=crop&w=1200&q=85", accent: "lime", entryCount: 0,
  },
  {
    id: "c041", number: 41, slug: "the-perfect-loop", title: "THE PERFECT LOOP.", brief: "Hide the ending inside the beginning.",
    description: "A completed drop now live in anonymous Reveal.", state: "REVEAL_LIVE", opensAt: iso(-9 * day), submissionClosesAt: iso(-3 * day), revealOpensAt: iso(-2 * day), votingClosesAt: iso(day), settlesAt: iso(2 * day),
    maxDurationSeconds: 30, maxBytes: 150_000_000, acceptedMimeTypes: ["video/mp4", "video/webm"], judgingDimensions: ["Originality", "Execution", "Entertainment"],
    rules: ["Maximum 30 seconds", "Seamless visual loop", "No stock footage"], skills: ["Editing", "Motion"], cover: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=85", accent: "blue", entryCount: 52,
  },
];

export const maya: PilotProfile = {
  id: "maya", handle: "maya.makes", displayName: "Maya Sen", ageBand: "18_24",
  bio: "Director and editor making tiny films with oversized tension. Open to sound people and practical-effects obsessives.",
  avatar: "https://i.pravatar.cc/400?img=47", challenges: 18, communityPicks: 6, judgePicks: 3, completionRate: 86,
  skills: [{ name: "Direction", proofs: 14 }, { name: "Editing", proofs: 12 }, { name: "Storytelling", proofs: 10 }, { name: "Cinematography", proofs: 7 }],
  roles: ["Director", "Editor", "Writer"],
  proofs: [
    { id: "p1", challengeNumber: 39, title: "LIGHT AFTER MIDNIGHT", role: "Director + Editor", cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=85", award: "COMMUNITY PICK", score: 4.72 },
    { id: "p2", challengeNumber: 37, title: "FUTURE, USED", role: "Cinematographer", cover: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85", award: "JUDGE PICK", score: 4.61 },
    { id: "p3", challengeNumber: 35, title: "THE LAST SOUND", role: "Editor", cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85", score: 4.34 },
  ],
};

export const revealEntries: RevealEntry[] = [
  { assignmentId: "a1", entryId: "e1", position: 1, total: 5, duration: 27, videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
  { assignmentId: "a2", entryId: "e2", position: 2, total: 5, duration: 31, videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
  { assignmentId: "a3", entryId: "e3", position: 3, total: 5, duration: 24, videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
];

export const inbox: InboxItem[] = [
  { id: "conv-maya", handle: "niko.cut", displayName: "Niko Alvarez", avatar: "https://i.pravatar.cc/160?img=12", preview: "The match cut works. Want me to send a tighter sound pass?", time: "12m", unread: 2, context: "Teammates · Challenge #042", state: "ACTIVE", kind: "message" },
  { id: "conv-ama", handle: "ama.sings", displayName: "Ama Okafor", avatar: "https://i.pravatar.cc/160?img=32", preview: "Shared: SOUND BEFORE PICTURE", time: "2h", unread: 0, context: "Both entered Challenge #038", state: "ACTIVE", kind: "message" },
  { id: "request-jules", handle: "jules.frames", displayName: "Jules Park", avatar: "https://i.pravatar.cc/160?img=11", preview: "Your lighting in The Last Sound was brilliant. I’m building a team…", time: "1d", unread: 1, context: "Discovered through your Thriller Proof", state: "REQUESTED", kind: "request" },
  { id: "team-42", handle: "room-42", displayName: "ROOM 42 CREW", avatar: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=180&q=80", preview: "Niko: Uploading the final sound mix now.", time: "8m", unread: 3, context: "Team conversation · Challenge #042", state: "ACTIVE", kind: "team" },
];

export const messages = [
  { id: "m1", mine: false, body: "The match cut works. The room feels much bigger than it is.", time: "10:12" },
  { id: "m2", mine: true, body: "That was the goal. I’m still unsure about the silence before the door moves.", time: "10:15" },
  { id: "m3", mine: false, body: "Keep it. The silence is doing the scary work.", time: "10:18", reaction: "⚡" },
  { id: "m4", mine: false, body: "Want me to send a tighter sound pass?", time: "10:19" },
];

export const getChallenge = (slug: string) => challenges.find((challenge) => challenge.slug === slug);
