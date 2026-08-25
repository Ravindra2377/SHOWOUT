import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/server/auth";
import { messagingEligibility } from "@/lib/domain/messaging";
import { rateLimit } from "@/lib/server/rate-limit";
import { track } from "@/lib/server/analytics";
const input=z.object({recipientId:z.string(),introduction:z.string().trim().min(1).max(500),context:z.object({sharedChallenge:z.boolean(),sharedTeam:z.boolean(),mutualConnection:z.boolean()})});
export async function POST(request:Request){const user=await currentUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});if(!rateLimit(`message-request:${user.id}`,5,86_400_000).allowed)return NextResponse.json({error:"Daily request limit reached"},{status:429});const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid request"},{status:400});const eligibility=messagingEligibility({...parsed.data.context,acceptedRequest:false,pilotEnabled:false,blocked:false,priorDecline:false,senderAgeBand:user.ageBand,recipientAgeBand:"18_24"});if(eligibility==="DENIED")return NextResponse.json({error:"Messaging is not permitted"},{status:403});track("message_request_sent",user.id,{recipientId:parsed.data.recipientId,eligibility});return NextResponse.json({conversationId:crypto.randomUUID(),state:eligibility==="ACTIVE"?"ACTIVE":"REQUESTED",senderMayContinue:eligibility==="ACTIVE"},{status:201});}
