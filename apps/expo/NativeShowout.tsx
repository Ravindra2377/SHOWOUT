/* eslint-disable @typescript-eslint/no-require-imports, jsx-a11y/alt-text */
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { api, type ApiChallenge, type CreatorReveal, type ProfilePayload, type RevealAssignment } from "./api";
import { ComponentProps, ReactNode, useEffect, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type Tab = "arcade" | "create" | "watch" | "profile";
type IconName = ComponentProps<typeof Ionicons>["name"];

const art = {
  hero: require("./assets/hero.jpg"),
  neon: require("./assets/neon.jpg"),
  mountains: require("./assets/mountains.jpg"),
  sound: require("./assets/sound.jpg"),
  calm: require("./assets/calm.jpg"),
  maya: require("./assets/maya.jpg"),
  astronaut: require("./assets/astronaut.jpg"),
};

export default function NativeShowout() {
  const [tab, setTab] = useState<Tab>("arcade");
  const [opacity] = useState(() => new Animated.Value(1));
  const [translate] = useState(() => new Animated.Value(0));
  const [backend, setBackend] = useState<"connecting" | "connected" | "offline">("connecting");

  useEffect(() => { api.ensureSession().then(() => setBackend("connected")).catch(() => setBackend("offline")); }, []);

  useEffect(() => {
    opacity.setValue(0);
    translate.setValue(10);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translate, { toValue: 0, damping: 18, stiffness: 180, useNativeDriver: true }),
    ]).start();
  }, [opacity, tab, translate]);

  return (
    <SafeAreaProvider>
      <LinearGradient colors={["#e9e8ff", "#f8eafa", "#eaf6ff"]} style={styles.app}>
        <StatusBar style="dark" />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.glow, styles.glowOne]} />
          <View style={[styles.glow, styles.glowTwo]} />
        </View>
        <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
          <Animated.View style={[styles.screen, { opacity, transform: [{ translateY: translate }] }]}>
            <BackendStatus state={backend} />
            {tab === "arcade" && <Arcade onEnter={() => setTab("create")} />}
            {tab === "create" && <Create />}
            {tab === "watch" && <Watch />}
            {tab === "profile" && <Profile />}
          </Animated.View>
          <BottomNav tab={tab} onChange={setTab} />
        </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
}

function BackendStatus({ state }: { state: "connecting" | "connected" | "offline" }) {
  return <View style={[styles.backendStatus, state === "offline" && styles.backendOffline]}><View style={[styles.backendDot, state === "offline" && styles.backendDotOffline]} /><Text style={styles.backendText}>{state === "connected" ? "PILOT SYNCED" : state === "offline" ? "OFFLINE · ACTIONS PAUSED" : "CONNECTING"}</Text></View>;
}

function TopBar({ title, subtitle, back, action = "notifications-outline" }: { title: string; subtitle?: string; back?: boolean; action?: IconName }) {
  return <View style={styles.topBar}>
    {back ? <IconButton icon="chevron-back" /> : <View style={styles.brandMark}><Text style={styles.brandText}>S</Text></View>}
    <View style={styles.topCopy}><Text style={styles.topTitle}>{title}</Text>{subtitle && <Text style={styles.topSubtitle}>{subtitle}</Text>}</View>
    <IconButton icon={action} />
  </View>;
}

function Arcade({ onEnter }: { onEnter: () => void }) {
  const [filter, setFilter] = useState("For You");
  const [liveChallenges, setLiveChallenges] = useState<ApiChallenge[]>([]);
  useEffect(() => { api.challenges().then(setLiveChallenges).catch(() => {}); }, []);
  const feature = liveChallenges.find((challenge) => challenge.number === 42);
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <TopBar title="Arcade" subtitle="Find a challenge. Make your proof." />
    <View style={styles.wordmarkRow}><Text style={styles.wordmark}>SHOWOUT</Text><View style={styles.liveDot} /></View>
    <Text style={styles.heroHeading}>PROVE IT.</Text>
    <View style={styles.segment}>{["For You", "Open", "Upcoming", "Reveal"].map(item => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.segmentItem, filter === item && styles.segmentActive]}><Text style={[styles.segmentText, filter === item && styles.segmentTextActive]}>{item}</Text></Pressable>)}</View>

    <Glass style={styles.featured}>
      <Image source={art.hero} style={styles.featuredImage} contentFit="cover" transition={250} />
      <LinearGradient colors={["transparent", "rgba(7,9,25,.93)"]} style={styles.featuredShade} />
      <View style={styles.featuredTop}><Badge text="FEATURED DROP" /><Text style={styles.challengeNo}>#042</Text></View>
      <View style={styles.featuredBottom}>
        <Text style={styles.featuredTitle}>ONE ROOM.{"\n"}ONE MINUTE.{"\n"}ONE THRILLER.</Text>
        <Text style={styles.featuredBrief}>{feature?.brief ?? "Make a thriller in one room."}</Text>
        <View style={styles.metaRow}><Meta icon="time-outline" label="60s max" /><Meta icon="person-outline" label="1 character" /><Meta icon="mic-off-outline" label="No dialogue" /></View>
        <Countdown />
        <GradientButton label="Enter Challenge" icon="arrow-forward" onPress={onEnter} />
      </View>
    </Glass>

    <SectionTitle title="Open challenges" action="View all" />
    <ChallengeRow image={art.sound} status={liveChallenges.find(c => c.number === 43)?.state ?? "OPEN"} title="SOUND BEFORE PICTURE" brief="Tell the story with your eyes closed." meta="4d left" />
    <ChallengeRow image={art.neon} status="REVEAL LIVE" title="THE PERFECT LOOP" brief="Hide the ending inside the beginning." meta="Vote now" live />
    <ChallengeRow image={art.calm} status="UPCOMING" title="MAKE IT MOVE" brief="Animate one overlooked object." meta="Opens Fri" />
    <View style={styles.endSpace} />
  </ScrollView>;
}

function Create() {
  const [terms, setTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<{ uri: string; name: string; mimeType: string; bytes: number; durationSeconds: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function chooseVideo(source: "library" | "camera") {
    setError(null);
    const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError(`Allow ${source === "camera" ? "camera" : "photo library"} access to choose your Entry.`); return; }
    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["videos"], videoMaxDuration: 60, quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], videoMaxDuration: 60, quality: 1 });
    if (result.canceled) return;
    const asset = result.assets[0]!;
    const mimeType = asset.mimeType ?? (asset.fileName?.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4");
    const bytes = asset.fileSize ?? (await (await fetch(asset.uri)).blob()).size;
    const durationSeconds = Math.max(0.1, (asset.duration ?? 0) / 1000);
    if (!["video/mp4", "video/webm", "video/quicktime"].includes(mimeType)) { setError("Choose an MP4, WebM, or QuickTime video."); return; }
    if (bytes > 250_000_000) { setError("This video is larger than the 250 MB challenge limit."); return; }
    if (durationSeconds > 60) { setError("This Entry is longer than the 60-second challenge limit."); return; }
    setSelected({ uri: asset.uri, name: asset.fileName ?? "challenge-042-entry.mp4", mimeType, bytes, durationSeconds });
  }

  async function handleSubmit() {
    if (!selected) { await chooseVideo("library"); return; }
    setBusy(true); setError(null); setProgress(1);
    try {
      await api.ensureSession();
      await api.uploadAndSubmit({ ...selected, caption, onProgress: setProgress });
      setSubmitted(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Submission failed. Retry safely with the same video."); }
    finally { setBusy(false); }
  }

  if (submitted) return <ScrollView contentContainerStyle={styles.scroll}><TopBar title="Create & Submit" back action="ellipsis-horizontal" /><Glass style={styles.successCard}><View style={styles.successIcon}><Ionicons name="lock-closed" size={30} color="#fff" /></View><Text style={styles.successKicker}>ENTRY SUBMITTED</Text><Text style={styles.successTitle}>HIDDEN.{"\n"}LOCKED.{"\n"}READY.</Text><Text style={styles.bodyCenter}>Your work is safely persisted in Challenge #042. Creator identity stays hidden until each vote is locked.</Text><Badge text="TERMS V1.1 ACCEPTED" /><GradientButton label="Back to Arcade" icon="checkmark" onPress={() => setSubmitted(false)} /></Glass></ScrollView>;
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <TopBar title="Create & Submit" back action="ellipsis-horizontal" />
    <Glass style={styles.challengeStrip}><Image source={art.hero} style={styles.stripImage} /><View style={{ flex: 1 }}><Text style={styles.stripLabel}>CHALLENGE #042</Text><Text style={styles.stripTitle}>One Room. One Minute.</Text></View><Ionicons name="chevron-forward" size={18} color="#645f7d" /></Glass>
    <Glass style={styles.deadlineCard}><Text style={styles.cardLabel}>SUBMISSION CLOSES IN</Text><Countdown dark /><View style={styles.progressTrack}><LinearGradient colors={["#6e57ff", "#2fc7f7"]} style={[styles.progressFill, { width: "58%" }]} /></View></Glass>
    <SectionTitle title="Challenge constraints" />
    <View style={styles.constraintGrid}><Constraint icon="timer-outline" title="Duration" value="Maximum 60s" /><Constraint icon="person-outline" title="Character" value="One visible" /><Constraint icon="mic-off-outline" title="Dialogue" value="None" /></View>
    <SectionTitle title="Your draft" action={selected ? "Ready" : "Choose video"} />
    <Pressable onPress={() => chooseVideo("library")}><Glass style={styles.draftCard}><Image source={art.neon} style={styles.draftImage} /><LinearGradient colors={["transparent", "rgba(5,8,23,.72)"]} style={StyleSheet.absoluteFill} /><View style={styles.playButton}><Ionicons name={selected ? "checkmark" : "add"} size={24} color="#fff" /></View><View style={styles.draftMeta}><Text style={styles.draftName}>{selected?.name ?? "Tap to choose your video"}</Text><Text style={styles.draftSize}>{selected ? `${Math.round(selected.durationSeconds)}s · ${(selected.bytes / 1_000_000).toFixed(1)} MB · ${selected.mimeType.replace("video/", "").toUpperCase()}` : "MP4, WebM or MOV · maximum 60s"}</Text></View></Glass></Pressable>
    <View style={styles.videoChoiceRow}><Pressable onPress={() => chooseVideo("library")} style={styles.videoChoice}><Ionicons name="images-outline" size={17} color="#6553df" /><Text style={styles.videoChoiceText}>Library</Text></Pressable><Pressable onPress={() => chooseVideo("camera")} style={styles.videoChoice}><Ionicons name="videocam-outline" size={17} color="#6553df" /><Text style={styles.videoChoiceText}>Record</Text></Pressable></View>
    <Glass style={styles.notesCard}><Text style={styles.cardLabel}>CAPTION</Text><TextInput value={caption} onChangeText={setCaption} style={styles.notesInput} placeholder="Add context without identifying yourself…" placeholderTextColor="#8c86a3" multiline maxLength={200} /><Text style={styles.counter}>{caption.length} / 200</Text></Glass>
    <Pressable onPress={() => setTerms(!terms)} style={styles.termsRow}><View style={[styles.checkbox, terms && styles.checkboxOn]}>{terms && <Ionicons name="checkmark" size={15} color="#fff" />}</View><Text style={styles.termsText}>I accept the challenge rules and narrow Content Rights Terms v1.1. I keep ownership of my work.</Text></Pressable>
    {busy && <View style={styles.uploadState}><Text style={styles.uploadText}>DIRECT UPLOAD · {progress}%</Text><View style={styles.progressTrack}><LinearGradient colors={["#7158ff", "#29c7ef"]} style={[styles.progressFill, { width: `${progress}%` }]} /></View></View>}
    {error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
    <GradientButton disabled={!terms || busy} label={busy ? "Uploading Entry" : selected ? "Submit Hidden Entry" : "Choose Video to Submit"} icon="lock-closed" onPress={handleSubmit} />
    <Text style={styles.microcopy}>Upload goes directly to storage. Your entry becomes locked at the server deadline.</Text><View style={styles.endSpace} />
  </ScrollView>;
}

function Watch() {
  const [scores, setScores] = useState({ Originality: 0, Execution: 0, Entertainment: 0 });
  const [assignments, setAssignments] = useState<RevealAssignment[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [creator, setCreator] = useState<CreatorReveal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const current = assignments[activeIndex];
  const ready = Object.values(scores).every(Boolean);
  useEffect(() => {
    api.ensureSession().then(() => api.reveal()).then((payload) => setAssignments(payload.assignments)).catch((cause) => setError(cause instanceof Error ? cause.message : "Reveal is unavailable.")).finally(() => setLoading(false));
  }, []);
  async function lock() {
    if (!current || !ready) return;
    setError(null);
    try {
      const result = await api.vote({ assignmentId: current.assignmentId, entryId: current.entryId, originality: scores.Originality, execution: scores.Execution, entertainment: scores.Entertainment, elapsedMs: Date.now() - startedAt });
      setCreator(result.creator);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Vote could not be locked."); }
  }
  function next() {
    setCreator(null); setScores({ Originality: 0, Execution: 0, Entertainment: 0 }); setStartedAt(Date.now());
    setActiveIndex((value) => Math.min(value + 1, assignments.length));
  }
  const complete = !loading && assignments.length > 0 && activeIndex >= assignments.length;
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <TopBar title="Watch & Vote" back action="options-outline" />
    <Glass style={styles.privacyBanner}><View style={styles.shield}><Ionicons name="shield-checkmark" size={17} color="#6653e8" /></View><View style={{ flex: 1 }}><Text style={styles.privacyTitle}>Creator hidden for fair voting</Text><Text style={styles.privacyCopy}>The API omits identity until your vote is locked.</Text></View></Glass>
    <View style={styles.voteProgress}><Text style={styles.voteCount}>{loading ? "Loading assignment…" : complete ? "Voting set complete" : current ? `Entry ${current.position} of ${current.total}` : "No eligible entries"}</Text><Text style={styles.percent}>{current?.total ? `${Math.round((current.position / current.total) * 100)}%` : "—"}</Text></View><View style={styles.progressTrack}><LinearGradient colors={["#7158ff", "#29c7ef"]} style={[styles.progressFill, { width: current?.total ? `${(current.position / current.total) * 100}%` : "0%" }]} /></View>
    <Glass style={styles.voteCard}><View style={styles.voteMedia}><Image source={complete ? art.mountains : art.neon} style={StyleSheet.absoluteFill} contentFit="cover" /><LinearGradient colors={["transparent", "rgba(3,4,18,.45)"]} style={StyleSheet.absoluteFill} /><Badge text={current ? `#${String(current.position).padStart(2,"0")} · ${Math.round(current.duration ?? 0)}s` : complete ? "SET COMPLETE" : "ANONYMOUS"} /><View style={styles.playButton}><Ionicons name={complete ? "checkmark" : "play"} size={27} color="#fff" /></View><IconButton icon="ellipsis-horizontal" dark /></View>
      {!creator ? <View style={styles.scoreArea}><Text style={styles.scoreTitle}>{complete ? "You showed up for the set." : "Score this entry"}</Text>{!complete && current && (Object.keys(scores) as Array<keyof typeof scores>).map(dimension => <View style={styles.scoreRow} key={dimension}><Text style={styles.scoreLabel}>{dimension}</Text><View style={styles.stars}>{[1,2,3,4,5].map(value => <Pressable key={value} onPress={() => setScores(state => ({ ...state, [dimension]: value }))} hitSlop={7}><Ionicons name={scores[dimension] >= value ? "star" : "star-outline"} size={29} color={scores[dimension] >= value ? "#516ff2" : "#b4b3c6"} /></Pressable>)}</View></View>)}{current && !complete && <GradientButton disabled={!ready} label="Lock My Vote" icon="lock-closed" onPress={lock} />}{error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}<View style={styles.secondaryActions}><Pressable style={styles.textAction} onPress={next}><Ionicons name="play-skip-forward-outline" size={16} color="#5e5974" /><Text style={styles.textActionLabel}>Skip</Text></Pressable><Pressable style={styles.textAction}><Ionicons name="flag-outline" size={16} color="#5e5974" /><Text style={styles.textActionLabel}>Report</Text></Pressable></View></View> : <LinearGradient colors={["#d8ffbd", "#c9f7ff"]} style={styles.revealPanel}><Text style={styles.revealKicker}>VOTE LOCKED · CREATOR REVEALED</Text><View style={styles.creatorRow}><Image source={art.maya} style={styles.creatorAvatar} /><View><Text style={styles.creatorName}>{creator.displayName}</Text><Text style={styles.creatorHandle}>@{creator.handle}</Text></View></View><Text style={styles.revealCopy}>Your scores are final. The creator cannot see how you rated this Entry.</Text><GradientButton label="Next Entry" icon="arrow-forward" onPress={next} /></LinearGradient>}
    </Glass>
    <SectionTitle title="Up next" /><Glass style={styles.nextCard}><Image source={art.mountains} style={styles.nextImage} /><View style={{ flex: 1 }}><Text style={styles.cardLabel}>NEXT ASSIGNMENT</Text><Text style={styles.nextTitle}>Anonymous until you vote</Text></View><Ionicons name="play-circle-outline" size={34} color="#6653e8" /></Glass><View style={styles.endSpace} />
  </ScrollView>;
}

function Profile() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.ensureSession().then(() => api.profile()).then(setProfile).catch((cause) => setError(cause instanceof Error ? cause.message : "Proof is unavailable.")); }, []);
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <TopBar title="Proof Profile" back action="ellipsis-horizontal" />
    <View style={styles.profileHero}><LinearGradient colors={["rgba(252,174,222,.65)", "rgba(148,218,255,.48)", "rgba(255,255,255,.1)"]} style={StyleSheet.absoluteFill} /><Image source={art.maya} style={styles.profileAvatar} /><Text style={styles.profileName}>{profile?.displayName ?? "Maya Sen"}</Text><Text style={styles.handle}>@{profile?.handle ?? "maya.makes"}</Text><Text style={styles.profileBio}>{profile?.bio ?? "Director and editor making tiny films with oversized tension."}</Text><View style={styles.skillChips}>{["Direction", "Editing", "Storytelling", "Cinematography"].map(skill => <Badge text={skill} key={skill} soft />)}</View></View>
    <Glass style={styles.statsCard}><Stat value={String(profile?.challenges ?? 18)} label="Challenges" /><Divider /><Stat value={String(profile?.communityPicks ?? 6)} label="Community Picks" /><Divider /><Stat value={String(profile?.judgePicks ?? 3)} label="Judge Picks" /></Glass>
    <Glass style={styles.proofScore}><View><Text style={styles.cardLabel}>COMPLETION RATE</Text><Text style={styles.proofNumber}>{profile ? `${profile.completionRate}%` : "86%"}</Text><Text style={styles.proofRank}>Derived from settled challenge data</Text></View><View style={styles.chart}><View style={[styles.chartBar,{height:20}]} /><View style={[styles.chartBar,{height:30}]} /><View style={[styles.chartBar,{height:25}]} /><View style={[styles.chartBar,{height:42}]} /><View style={[styles.chartBar,{height:50}]} /></View></Glass>
    {error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
    <SectionTitle title="Proven skills" action="Derived from Proof" /><View style={styles.skillsPanel}>{[["Direction",14],["Editing",12],["Storytelling",10]].map(([skill,count],index)=><View style={styles.skillLine} key={String(skill)}><Text style={styles.skillName}>{skill}</Text><View style={styles.skillTrack}><LinearGradient colors={["#7659ff","#46c9ed"]} style={[styles.skillFill,{width:`${90-index*12}%`}]} /></View><Text style={styles.skillCount}>{count}</Text></View>)}</View>
    <SectionTitle title="Recent Proof" action="Settled challenges" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.proofRail}><ProofCard image={art.neon} title={profile?.proofs[0]?.title ?? "Light After Midnight"} label={profile?.proofs[0]?.communityPick ? "COMMUNITY PICK" : "COMPLETED"} /><ProofCard image={art.astronaut} title={profile?.proofs[1]?.title ?? "Future, Used"} label={profile?.proofs[1]?.judgePick ? "JUDGE PICK" : "COMPLETED"} /><ProofCard image={art.mountains} title={profile?.proofs[2]?.title ?? "The Last Sound"} label="COMPLETED" /></ScrollView>
    <GradientButton label="Invite to Collaborate" icon="people" onPress={() => {}} /><View style={styles.endSpace} />
  </ScrollView>;
}

function BottomNav
({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const items: Array<[Tab, IconName, string]> = [["arcade","compass","Arcade"],["create","add-circle","Create"],["watch","play-circle","Watch"],["profile","person-circle","Profile"]];
  return <BlurView intensity={85} tint="light" style={styles.bottomNav}>{items.map(([value,icon,label]) => <Pressable key={value} onPress={() => onChange(value)} style={styles.navItem}><View style={[styles.navIcon, tab === value && styles.navIconActive]}><Ionicons name={tab === value ? icon : (`${icon}-outline` as IconName)} size={22} color={tab === value ? "#fff" : "#77718d"} /></View><Text style={[styles.navLabel, tab === value && styles.navLabelActive]}>{label}</Text></Pressable>)}</BlurView>;
}

function Glass({ children, style }: { children: ReactNode; style?: object }) { return <BlurView intensity={52} tint="light" style={[styles.glass, style]}>{children}</BlurView>; }
function IconButton({ icon, dark }: { icon: IconName; dark?: boolean }) { return <Pressable style={[styles.iconButton, dark && styles.iconButtonDark]}><Ionicons name={icon} size={19} color={dark ? "#fff" : "#4e4961"} /></Pressable>; }
function Badge({ text, soft }: { text: string; soft?: boolean }) { return <View style={[styles.badge, soft && styles.badgeSoft]}><Text style={[styles.badgeText, soft && styles.badgeTextSoft]}>{text}</Text></View>; }
function Meta({ icon, label }: { icon: IconName; label: string }) { return <View style={styles.meta}><Ionicons name={icon} size={15} color="#fff" /><Text style={styles.metaText}>{label}</Text></View>; }
function Countdown({ dark }: { dark?: boolean }) { return <View style={[styles.countdown, dark && styles.countdownLight]}>{[["02","DAYS"],["09","HRS"],["42","MIN"],["19","SEC"]].map(([value,label]) => <View style={styles.timeBlock} key={label}><Text style={[styles.timeValue, dark && styles.timeValueDark]}>{value}</Text><Text style={[styles.timeLabel, dark && styles.timeLabelDark]}>{label}</Text></View>)}</View>; }
function GradientButton({ label, icon, onPress, disabled }: { label: string; icon: IconName; onPress: () => void; disabled?: boolean }) { return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.ctaWrap, pressed && { transform: [{ scale: .985 }] }, disabled && { opacity: .42 }]}><LinearGradient colors={["#7655f7", "#397bf4", "#42d4e9"]} start={{x:0,y:.5}} end={{x:1,y:.5}} style={styles.cta}><Text style={styles.ctaText}>{label}</Text><Ionicons name={icon} size={18} color="#fff" /></LinearGradient></Pressable>; }
function SectionTitle({ title, action }: { title: string; action?: string }) { return <View style={styles.sectionTitle}><Text style={styles.sectionHeading}>{title}</Text>{action && <Text style={styles.sectionAction}>{action}</Text>}</View>; }
function ChallengeRow({ image, status, title, brief, meta, live }: { image: number; status: string; title: string; brief: string; meta: string; live?: boolean }) { return <Glass style={styles.challengeRow}><Image source={image} style={styles.rowImage} /><View style={styles.rowCopy}><View style={styles.statusRow}><View style={[styles.statusDot, live && { backgroundColor: "#6f54ff" }]} /><Text style={styles.statusText}>{status}</Text></View><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowBrief}>{brief}</Text></View><Text style={styles.rowMeta}>{meta}</Text></Glass>; }
function Constraint({ icon, title, value }: { icon: IconName; title: string; value: string }) { return <Glass style={styles.constraint}><View style={styles.constraintIcon}><Ionicons name={icon} size={21} color="#6553df" /></View><Text style={styles.constraintTitle}>{title}</Text><Text style={styles.constraintValue}>{value}</Text></Glass>; }
function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Divider() { return <View style={styles.divider} />; }
function ProofCard({ image, title, label }: { image: number; title: string; label: string }) { return <Glass style={styles.proofCard}><Image source={image} style={styles.proofImage} /><View style={styles.proofCardCopy}><Text style={styles.proofLabel}>{label}</Text><Text style={styles.proofTitle}>{title}</Text></View></Glass>; }

const styles = StyleSheet.create({
  app:{flex:1,overflow:"hidden"},safe:{flex:1},screen:{flex:1},backendStatus:{position:"absolute",right:16,top:3,zIndex:20,flexDirection:"row",alignItems:"center",gap:5,paddingHorizontal:8,paddingVertical:5,borderRadius:10,backgroundColor:"rgba(218,255,188,.86)"},backendOffline:{backgroundColor:"rgba(255,220,210,.9)"},backendDot:{width:6,height:6,borderRadius:3,backgroundColor:"#63a900"},backendDotOffline:{backgroundColor:"#df5438"},backendText:{fontSize:7,fontWeight:"900",letterSpacing:.5,color:"#39334c"},scroll:{paddingHorizontal:16,paddingTop:6},glow:{position:"absolute",width:260,height:260,borderRadius:130,opacity:.22},glowOne:{backgroundColor:"#ff75c8",right:-100,top:80},glowTwo:{backgroundColor:"#53c9ff",left:-100,bottom:140},
  topBar:{height:58,flexDirection:"row",alignItems:"center",gap:11},brandMark:{width:40,height:40,borderRadius:14,backgroundColor:"#1b1740",alignItems:"center",justifyContent:"center",shadowColor:"#534bc6",shadowOpacity:.25,shadowRadius:12},brandText:{color:"#fff",fontSize:21,fontWeight:"900"},topCopy:{flex:1},topTitle:{fontSize:18,fontWeight:"800",color:"#201d31",letterSpacing:-.4},topSubtitle:{fontSize:11,color:"#77718d",marginTop:2},iconButton:{width:40,height:40,borderRadius:14,backgroundColor:"rgba(255,255,255,.7)",borderWidth:1,borderColor:"rgba(255,255,255,.95)",alignItems:"center",justifyContent:"center"},iconButtonDark:{position:"absolute",right:10,top:10,backgroundColor:"rgba(20,18,42,.45)",borderColor:"rgba(255,255,255,.35)"},
  wordmarkRow:{flexDirection:"row",alignItems:"center",marginTop:8},wordmark:{fontSize:13,fontWeight:"900",letterSpacing:2.4,color:"#201d31"},liveDot:{width:7,height:7,backgroundColor:"#7456f4",borderRadius:4,marginLeft:4},heroHeading:{fontSize:48,fontWeight:"900",letterSpacing:-2.2,color:"#17142a",marginTop:5,marginBottom:12},segment:{padding:4,backgroundColor:"rgba(255,255,255,.55)",borderRadius:16,flexDirection:"row",marginBottom:14,borderWidth:1,borderColor:"rgba(255,255,255,.9)"},segmentItem:{flex:1,minHeight:38,alignItems:"center",justifyContent:"center",borderRadius:12},segmentActive:{backgroundColor:"#fff",shadowColor:"#5a4cc4",shadowOpacity:.13,shadowRadius:8},segmentText:{fontSize:11,fontWeight:"700",color:"#817a96"},segmentTextActive:{color:"#302b4a"},
  glass:{overflow:"hidden",borderRadius:22,borderWidth:1,borderColor:"rgba(255,255,255,.9)",backgroundColor:"rgba(255,255,255,.48)",shadowColor:"#5745b5",shadowOpacity:.1,shadowRadius:16,shadowOffset:{width:0,height:7}},featured:{height:520,padding:0},featuredImage:{...StyleSheet.absoluteFillObject},featuredShade:{...StyleSheet.absoluteFillObject},featuredTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:14},challengeNo:{color:"#fff",fontWeight:"900",fontSize:15},featuredBottom:{marginTop:"auto",padding:18},featuredTitle:{fontSize:34,lineHeight:31,fontWeight:"900",letterSpacing:-1.2,color:"#fff"},featuredBrief:{fontSize:13,color:"rgba(255,255,255,.78)",marginTop:8},badge:{alignSelf:"flex-start",paddingHorizontal:9,paddingVertical:5,borderRadius:9,backgroundColor:"rgba(231,255,116,.92)"},badgeText:{fontSize:9,fontWeight:"900",letterSpacing:.7,color:"#242137"},badgeSoft:{backgroundColor:"rgba(255,255,255,.64)",borderWidth:1,borderColor:"rgba(255,255,255,.8)"},badgeTextSoft:{color:"#514b68",letterSpacing:0},metaRow:{flexDirection:"row",gap:7,marginVertical:14},meta:{flex:1,alignItems:"center",paddingVertical:9,borderRadius:13,backgroundColor:"rgba(255,255,255,.14)",borderWidth:1,borderColor:"rgba(255,255,255,.18)"},metaText:{fontSize:9,color:"#fff",fontWeight:"700",marginTop:3},countdown:{flexDirection:"row",backgroundColor:"rgba(15,12,35,.36)",borderRadius:15,padding:8,marginBottom:12},countdownLight:{backgroundColor:"rgba(255,255,255,.5)",marginTop:10},timeBlock:{flex:1,alignItems:"center"},timeValue:{color:"#fff",fontSize:17,fontWeight:"900"},timeLabel:{color:"rgba(255,255,255,.58)",fontSize:7,fontWeight:"800",marginTop:1},timeValueDark:{color:"#29243d"},timeLabelDark:{color:"#888198"},ctaWrap:{borderRadius:17,overflow:"hidden",marginTop:6},cta:{minHeight:52,paddingHorizontal:18,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10},ctaText:{color:"#fff",fontSize:13,fontWeight:"900"},sectionTitle:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:24,marginBottom:10},sectionHeading:{fontSize:17,fontWeight:"900",color:"#211e33"},sectionAction:{fontSize:10,fontWeight:"700",color:"#6e65a2"},challengeRow:{minHeight:96,flexDirection:"row",alignItems:"center",padding:9,marginBottom:9,borderRadius:18},rowImage:{width:78,height:78,borderRadius:14},rowCopy:{flex:1,paddingHorizontal:11},statusRow:{flexDirection:"row",alignItems:"center",gap:5},statusDot:{width:6,height:6,borderRadius:3,backgroundColor:"#cbe933"},statusText:{fontSize:8,fontWeight:"900",color:"#6d667d",letterSpacing:.6},rowTitle:{fontSize:12,fontWeight:"900",color:"#2c283e",marginTop:5},rowBrief:{fontSize:10,color:"#7e778f",marginTop:3},rowMeta:{fontSize:9,fontWeight:"800",color:"#6553df"},
  challengeStrip:{padding:10,flexDirection:"row",alignItems:"center",gap:11,borderRadius:18},stripImage:{width:50,height:50,borderRadius:13},stripLabel:{fontSize:8,fontWeight:"900",letterSpacing:.7,color:"#705fd6"},stripTitle:{fontSize:13,fontWeight:"800",color:"#302c45",marginTop:4},deadlineCard:{padding:14,marginTop:11,borderRadius:18},cardLabel:{fontSize:9,fontWeight:"900",letterSpacing:.7,color:"#706a83"},progressTrack:{height:7,borderRadius:4,backgroundColor:"rgba(94,86,123,.12)",overflow:"hidden",marginTop:10},progressFill:{height:"100%",borderRadius:4},constraintGrid:{flexDirection:"row",gap:8},constraint:{flex:1,padding:11,minHeight:118,borderRadius:17},constraintIcon:{width:34,height:34,borderRadius:11,backgroundColor:"rgba(112,86,244,.12)",alignItems:"center",justifyContent:"center"},constraintTitle:{fontSize:10,fontWeight:"900",color:"#322d45",marginTop:10},constraintValue:{fontSize:9,color:"#777187",marginTop:3},draftCard:{height:225,padding:0},draftImage:{...StyleSheet.absoluteFillObject},playButton:{position:"absolute",alignSelf:"center",top:"38%",width:58,height:58,borderRadius:29,backgroundColor:"rgba(21,18,47,.58)",borderWidth:1,borderColor:"rgba(255,255,255,.65)",alignItems:"center",justifyContent:"center"},draftMeta:{position:"absolute",left:14,bottom:13},draftName:{fontSize:13,fontWeight:"900",color:"#fff"},draftSize:{fontSize:9,color:"rgba(255,255,255,.72)",marginTop:3},notesCard:{padding:14,marginTop:11,borderRadius:18},notesInput:{minHeight:72,fontSize:12,color:"#302b44",textAlignVertical:"top",marginTop:9},counter:{fontSize:9,color:"#8b8498",alignSelf:"flex-end"},termsRow:{flexDirection:"row",alignItems:"flex-start",gap:10,marginVertical:16,paddingHorizontal:3},checkbox:{width:23,height:23,borderRadius:7,borderWidth:1.5,borderColor:"#8c84ae",alignItems:"center",justifyContent:"center"},checkboxOn:{backgroundColor:"#6554e9",borderColor:"#6554e9"},termsText:{flex:1,fontSize:10,lineHeight:15,color:"#5f596f"},microcopy:{fontSize:9,textAlign:"center",color:"#898295",marginTop:9},videoChoiceRow:{flexDirection:"row",gap:8,marginTop:9},videoChoice:{flex:1,minHeight:42,borderRadius:13,backgroundColor:"rgba(255,255,255,.55)",borderWidth:1,borderColor:"rgba(255,255,255,.9)",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7},videoChoiceText:{fontSize:10,fontWeight:"900",color:"#514a71"},uploadState:{paddingVertical:10},uploadText:{fontSize:9,fontWeight:"900",letterSpacing:.8,color:"#6553df"},errorText:{fontSize:10,lineHeight:15,color:"#9e321f",backgroundColor:"rgba(255,225,217,.8)",padding:10,borderRadius:12,marginVertical:8},
  successCard:{padding:24,alignItems:"center",marginTop:45},successIcon:{width:64,height:64,borderRadius:22,backgroundColor:"#6554e9",alignItems:"center",justifyContent:"center"},successKicker:{fontSize:9,fontWeight:"900",letterSpacing:1,color:"#6554e9",marginTop:20},successTitle:{fontSize:39,lineHeight:37,fontWeight:"900",textAlign:"center",color:"#201d31",marginTop:8},bodyCenter:{fontSize:12,lineHeight:18,textAlign:"center",color:"#716b80",marginVertical:16},
  privacyBanner:{padding:11,flexDirection:"row",alignItems:"center",gap:10,borderRadius:17},shield:{width:35,height:35,borderRadius:12,backgroundColor:"rgba(107,83,233,.12)",alignItems:"center",justifyContent:"center"},privacyTitle:{fontSize:11,fontWeight:"900",color:"#302c43"},privacyCopy:{fontSize:9,color:"#827b92",marginTop:2},voteProgress:{flexDirection:"row",justifyContent:"space-between",marginTop:16},voteCount:{fontSize:12,fontWeight:"900",color:"#312d45"},percent:{fontSize:10,fontWeight:"800",color:"#70699a"},voteCard:{padding:0,marginTop:13},voteMedia:{height:260,overflow:"hidden",padding:11},scoreArea:{padding:15},scoreTitle:{fontSize:15,fontWeight:"900",color:"#2b273e",marginBottom:9},scoreRow:{marginVertical:6},scoreLabel:{fontSize:9,fontWeight:"900",color:"#6d667d",marginBottom:5},stars:{flexDirection:"row",justifyContent:"space-between"},secondaryActions:{flexDirection:"row",justifyContent:"space-between",paddingTop:10},textAction:{flexDirection:"row",alignItems:"center",gap:5,padding:8},textActionLabel:{fontSize:10,fontWeight:"800",color:"#5e5974"},revealPanel:{padding:16},revealKicker:{fontSize:8,fontWeight:"900",letterSpacing:.7,color:"#385950"},creatorRow:{flexDirection:"row",alignItems:"center",gap:11,marginTop:12},creatorAvatar:{width:54,height:54,borderRadius:20},creatorName:{fontSize:16,fontWeight:"900",color:"#252c32"},creatorHandle:{fontSize:9,color:"#687476",marginTop:3},revealCopy:{fontSize:10,lineHeight:15,color:"#5c6968",marginVertical:11},nextCard:{padding:9,flexDirection:"row",alignItems:"center",gap:11,borderRadius:17},nextImage:{width:68,height:56,borderRadius:12},nextTitle:{fontSize:11,fontWeight:"800",color:"#302b44",marginTop:4},
  profileHero:{alignItems:"center",marginHorizontal:-16,paddingHorizontal:20,paddingTop:20,paddingBottom:22,overflow:"hidden"},profileAvatar:{width:104,height:104,borderRadius:38,borderWidth:3,borderColor:"rgba(255,255,255,.88)"},profileName:{fontSize:25,fontWeight:"900",color:"#211d34",marginTop:11},handle:{fontSize:11,fontWeight:"700",color:"#6d6591",marginTop:2},profileBio:{fontSize:11,lineHeight:16,textAlign:"center",color:"#656074",maxWidth:290,marginTop:10},skillChips:{flexDirection:"row",justifyContent:"center",flexWrap:"wrap",gap:6,marginTop:12},statsCard:{flexDirection:"row",padding:15,alignItems:"center",borderRadius:18},stat:{flex:1,alignItems:"center"},statValue:{fontSize:23,fontWeight:"900",color:"#2a263e"},statLabel:{fontSize:8,fontWeight:"800",color:"#7e778e",textAlign:"center",marginTop:3},divider:{width:1,height:34,backgroundColor:"rgba(96,87,121,.15)"},proofScore:{padding:15,marginTop:10,flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end",borderRadius:18},proofNumber:{fontSize:34,fontWeight:"900",color:"#2a263e",marginTop:4},proofRank:{fontSize:9,color:"#6f6880"},chart:{height:55,flexDirection:"row",alignItems:"flex-end",gap:5},chartBar:{width:7,borderRadius:4,backgroundColor:"#7659ef"},skillsPanel:{gap:12},skillLine:{flexDirection:"row",alignItems:"center",gap:8},skillName:{width:78,fontSize:10,fontWeight:"800",color:"#4f495f"},skillTrack:{height:7,flex:1,backgroundColor:"rgba(93,84,122,.12)",borderRadius:4,overflow:"hidden"},skillFill:{height:7,borderRadius:4},skillCount:{width:20,fontSize:9,fontWeight:"900",color:"#6c64a0"},proofRail:{gap:10,paddingRight:16},proofCard:{width:154,padding:0,borderRadius:18},proofImage:{width:"100%",height:150},proofCardCopy:{padding:10},proofLabel:{fontSize:7,fontWeight:"900",letterSpacing:.6,color:"#6553df"},proofTitle:{fontSize:11,fontWeight:"900",color:"#2a263c",marginTop:4,textTransform:"uppercase"},
  bottomNav:{height:76,flexDirection:"row",borderTopWidth:1,borderColor:"rgba(255,255,255,.95)",paddingTop:7,paddingBottom:8,overflow:"hidden"},navItem:{flex:1,alignItems:"center",justifyContent:"center"},navIcon:{width:38,height:32,borderRadius:13,alignItems:"center",justifyContent:"center"},navIconActive:{backgroundColor:"#6554e9",shadowColor:"#5b4dc9",shadowOpacity:.3,shadowRadius:8},navLabel:{fontSize:8,fontWeight:"700",color:"#857e92",marginTop:3},navLabelActive:{color:"#4f45a3"},endSpace:{height:22},
});
