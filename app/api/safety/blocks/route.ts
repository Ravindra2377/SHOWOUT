import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/server/auth";
import { store } from "@/lib/server/store";
import { track } from "@/lib/server/analytics";
const input=z.object({blockedUserId:z.string().min(1)});
export async function POST(request:Request){const user=await currentUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success||parsed.data.blockedUserId===user.id)return NextResponse.json({error:"Invalid block"},{status:400});store.blocks.add(`${user.id}:${parsed.data.blockedUserId}`);track("block_performed",user.id,{blockedUserId:parsed.data.blockedUserId});return NextResponse.json({blocked:true});}
