import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { track } from "@/lib/server/analytics";
const input=z.object({subjectType:z.enum(["USER","ENTRY","MESSAGE"]),subjectId:z.string(),reason:z.enum(["HARASSMENT","SPAM","UNSAFE","HATE","OTHER"]),details:z.string().max(1000).optional()});
export async function POST(request:Request){const user=await currentUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});if(!rateLimit(`report:${user.id}`,10,86_400_000).allowed)return NextResponse.json({error:"Report limit reached"},{status:429});const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid report"},{status:400});const reportId=crypto.randomUUID();track("report_submitted",user.id,{reportId,subjectType:parsed.data.subjectType,subjectId:parsed.data.subjectId});return NextResponse.json({reportId,status:"OPEN",evidenceReference:parsed.data.subjectType==="MESSAGE"?parsed.data.subjectId:undefined},{status:201});}
