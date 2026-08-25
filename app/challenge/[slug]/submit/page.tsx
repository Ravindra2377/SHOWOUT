import { notFound } from "next/navigation";
import { getChallenge } from "@/lib/demo-data";
import { SubmissionFlow } from "@/components/submission-flow";

export default async function SubmitPage({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; const challenge=getChallenge(slug); if(!challenge) notFound(); return <SubmissionFlow challenge={challenge}/>; }
