import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Avtorizatsiya talab qilinadi."},{status:401});
 const {data,error}=await supabase.rpc("learning_get_progress");
 if(error){console.error("[learning/progress GET]",error.message);return NextResponse.json({error:"Progress sxemasi tayyor emas. Supabase migratsiyasini bajaring."},{status:503});}
 return NextResponse.json({progress:data});
}
export async function POST(req:Request){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Avtorizatsiya talab qilinadi."},{status:401});
 let body:Record<string,unknown>;try{body=await req.json()}catch{return NextResponse.json({error:"JSON so‘rov talab qilinadi."},{status:400});}
 const trackId=body.trackId,lessonId=body.lessonId,accuracy=body.accuracy;
 if(!["english","coding","cyber"].includes(String(trackId))||!Number.isInteger(lessonId)||Number(lessonId)<1||Number(lessonId)>5||!Number.isInteger(accuracy)||Number(accuracy)<0||Number(accuracy)>100){
  return NextResponse.json({error:"Dars ma’lumotlari noto‘g‘ri."},{status:400});
 }
 const {data,error}=await supabase.rpc("learning_complete_lesson",{p_track_id:trackId,p_lesson_id:lessonId,p_accuracy:accuracy});
 if(error){const conflict=error.message.includes("finish previous");return NextResponse.json({error:conflict?"Oldingi darsni avval tugating.":"Progressni saqlab bo‘lmadi. Supabase migratsiyasi va RPC funksiyalarini tekshiring."},{status:conflict?409:503});}
 return NextResponse.json({progress:data});
}
