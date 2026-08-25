import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const baseUrl = (process.env.EXPO_PUBLIC_SHOWOUT_URL ?? "http://localhost:3000").replace(/\/$/, "");
const tokenKey = "showout_session_token";
let memoryToken: string | null = null;

export type ApiChallenge = { id: string; number: number; slug: string; title: string; brief: string; state: string; submissionClosesAt: string; maxDurationSeconds: number; maxBytes: number; acceptedMimeTypes: string[]; rules: string[]; entryCount: number };
export type RevealAssignment = { assignmentId: string; entryId: string; position: number; total: number; duration: number | null; caption: string; videoUrl: string };
export type CreatorReveal = { handle: string; displayName: string; avatarUrl?: string | null };
export type ProfilePayload = { displayName: string; handle: string; bio: string; challenges: number; communityPicks: number; judgePicks: number; completionRate: number; proofs: Array<{ id: string; title: string; challengeNumber: number; score: number; communityPick: boolean; judgePick: boolean }> };

async function storedToken() {
  if (memoryToken) return memoryToken;
  if (Platform.OS === "web") memoryToken = globalThis.localStorage?.getItem(tokenKey) ?? null;
  else memoryToken = await SecureStore.getItemAsync(tokenKey);
  return memoryToken;
}
async function saveToken(value: string) {
  memoryToken = value;
  if (Platform.OS === "web") globalThis.localStorage?.setItem(tokenKey, value);
  else await SecureStore.setItemAsync(tokenKey, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}
async function parse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `SHOWOUT API failed (${response.status})`);
  return payload;
}
async function call<T>(path: string, init: RequestInit = {}) {
  const token = await storedToken();
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { accept: "application/json", "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...init.headers } });
  return parse<T>(response);
}

export const api = {
  baseUrl,
  async ensureSession(account: "maya" | "voter" = "maya") {
    const existing = await storedToken();
    if (existing) {
      try { await call<{ profile: ProfilePayload }>("/api/profile/me"); return existing; } catch { memoryToken = null; }
    }
    const session = await parse<{ token: string }>(await fetch(`${baseUrl}/api/auth/local`, { method: "POST", headers: { "content-type": "application/json", ...(process.env.EXPO_PUBLIC_PILOT_ACCESS_CODE ? { "x-showout-pilot-code": process.env.EXPO_PUBLIC_PILOT_ACCESS_CODE } : {}) }, body: JSON.stringify({ account }) }));
    await saveToken(session.token);
    return session.token;
  },
  async challenges() { return (await call<{ challenges: ApiChallenge[] }>("/api/challenges")).challenges; },
  async profile() { return (await call<{ profile: ProfilePayload }>("/api/profile/me")).profile; },
  async reveal(slug = "the-perfect-loop") { return call<{ challenge: { number: number; title: string }; assignments: RevealAssignment[] }>(`/api/reveal/${slug}`); },
  async vote(input: { assignmentId: string; entryId: string; originality: number; execution: number; entertainment: number; elapsedMs: number }) {
    return call<{ locked: true; creator: CreatorReveal }>("/api/votes", { method: "POST", body: JSON.stringify({ ...input, deviceSignal: `${Platform.OS}-expo-pilot` }) });
  },
  async uploadAndSubmit(input: { uri: string; mimeType: string; bytes: number; durationSeconds: number; caption: string; onProgress: (progress: number) => void }) {
    const intent = await call<{ assetId: string; uploadUrl: string; headers: Record<string,string> }>("/api/uploads/intent", { method: "POST", body: JSON.stringify({ challengeSlug: "one-room-one-minute-one-thriller", mimeType: input.mimeType, bytes: input.bytes, durationSeconds: input.durationSeconds }) });
    const blob = await (await fetch(input.uri)).blob();
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", intent.uploadUrl.startsWith("http") ? intent.uploadUrl : `${baseUrl}${intent.uploadUrl}`);
      Object.entries(intent.headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
      xhr.upload.onprogress = (event) => { if (event.lengthComputable) input.onProgress(Math.round((event.loaded / event.total) * 100)); };
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`));
      xhr.onerror = () => reject(new Error("Upload connection failed. Check that the phone and development server share Wi-Fi."));
      xhr.send(blob);
    });
    return call<{ entryId: string; status: string; hidden: true }>("/api/submissions", { method: "POST", body: JSON.stringify({ challengeSlug: "one-room-one-minute-one-thriller", assetId: intent.assetId, caption: input.caption, rulesAccepted: true, rightsTermsVersion: "1.1", idempotencyKey: `expo-${Date.now()}-${Math.random().toString(36).slice(2)}`, aiMediaDisclosed: false }) });
  },
};
