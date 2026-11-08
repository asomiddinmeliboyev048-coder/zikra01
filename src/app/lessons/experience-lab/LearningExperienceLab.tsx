"use client";

import { useEffect, useState } from "react";
import { Swords } from "lucide-react";
import SkillDuel from "./SkillDuel";
import AssessmentFlow from "./AssessmentFlow";
import LearningOnboarding, { type LearningPlanInput } from "./LearningOnboarding";
import LearningHub from "./LearningHub";
import type { AssessmentTrack } from "./assessment-bank";

const titles:Record<AssessmentTrack,string>={english:"Ingliz tili",russian:"Rus tili",coding:"Dasturlash",cyber:"Kiberxavfsizlik"};
const trackIds:AssessmentTrack[]=["english","russian","coding","cyber"];
type SavedAssessment={score:number;total:number;level:string;practical_passed:boolean;assessed_at:string}|null;

function fromDatabase(row:any):LearningPlanInput{
 return {trackId:row.track_id,skillName:row.skill_name,purpose:row.purpose,currentLevel:row.current_level,targetLevel:row.target_level,dailyMinutes:row.daily_minutes,targetDate:row.target_date||"",learningStyle:row.learning_style,interests:Array.isArray(row.interests)?row.interests:[]};
}

export default function LearningExperienceLab() {
 const [plan,setPlan]=useState<LearningPlanInput|null>(null);
 const [assessment,setAssessment]=useState<SavedAssessment>(null);
 const [loading,setLoading]=useState(true);
 const [assessmentOpen,setAssessmentOpen]=useState(false);
 const [duelOpen,setDuelOpen]=useState(false);
 const [duelTrack,setDuelTrack]=useState<AssessmentTrack>("english");

 useEffect(()=>{
  let alive=true;
  (async()=>{
   try{
    const rows=await Promise.all(trackIds.map(async track=>{const r=await fetch("/api/learning/plan?track="+track,{cache:"no-store"});if(!r.ok)return null;const d=await r.json();return d.plan?{...d.plan,_track:track}:null;}));
    const saved=rows.filter(Boolean).sort((a:any,b:any)=>String(b.updated_at||"").localeCompare(String(a.updated_at||"")))[0] as any;
    if(!alive)return;
    if(saved){const p=fromDatabase(saved);setPlan(p);setDuelTrack(p.trackId);const r=await fetch("/api/learning/assessment?track="+p.trackId,{cache:"no-store"});if(r.ok){const d=await r.json();if(alive&&d.assessment)setAssessment(d.assessment);}}
   }catch(e){console.error("[learning-hub]",e)}finally{if(alive)setLoading(false)}
  })();
  return()=>{alive=false};
 },[]);

 if(loading)return <div className="grid min-h-[100dvh] place-items-center bg-[#f7faf9]"><div className="text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700"/><p className="mt-4 text-sm font-semibold text-slate-500">Shaxsiy o‘quv makoningiz yuklanmoqda…</p></div></div>;
 if(assessmentOpen&&plan)return <div className="fixed inset-0 z-[100] h-[100dvh] w-full overflow-y-auto overscroll-y-contain touch-pan-y bg-[#f4f8f7]"><AssessmentFlow track={plan.trackId} plan={plan} onClose={()=>{setAssessmentOpen(false);void fetch("/api/learning/assessment?track="+plan.trackId,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(d?.assessment)setAssessment(d.assessment)}).catch(()=>{});}}/></div>;
 if(duelOpen)return <div className="fixed inset-0 z-[110] h-[100dvh] w-full overflow-hidden bg-white"><SkillDuel skill={titles[duelTrack]} onClose={()=>setDuelOpen(false)}/></div>;
 if(plan)return <LearningHub plan={plan} assessment={assessment} onEdit={()=>{setPlan(null);setAssessment(null)}} onAssess={()=>setAssessmentOpen(true)} onDuel={track=>{setDuelTrack(track);setDuelOpen(true)}}/>;
 return <LearningOnboarding onStart={(track,nextPlan)=>{setPlan(nextPlan);setDuelTrack(track);setAssessmentOpen(true);}}/>;
}
