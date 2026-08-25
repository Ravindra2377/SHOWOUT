import { notFound } from "next/navigation";
import { getChallenge } from "@/lib/demo-data";
import { RevealVoting } from "@/components/reveal-voting";

export default async function RevealPage({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; const challenge=getChallenge(slug); if(!challenge) notFound(); return <RevealVoting challenge={challenge}/>; }
