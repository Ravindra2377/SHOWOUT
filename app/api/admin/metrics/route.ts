import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { store } from "@/lib/server/store";
export async function GET(){const user=await currentUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});if(user.role!=="ADMIN")return NextResponse.json({error:"Forbidden"},{status:403});const count=(name:string)=>store.analytics.filter(event=>event.name===name).length;return NextResponse.json({entered:count("challenge_entered"),submitted:count("entry_submitted"),revealParticipants:new Set(store.analytics.filter(x=>x.name==="reveal_viewed").map(x=>x.userId)).size,inviters:new Set(store.analytics.filter(x=>x.name==="invitation_created").map(x=>x.userId)).size,secondChallenge:count("second_challenge_entered")});}
