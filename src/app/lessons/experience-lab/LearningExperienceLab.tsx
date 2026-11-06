"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import SkillDuel from "./SkillDuel";
import AssessmentFlow from "./AssessmentFlow";
import LearningOnboarding, { type LearningPlanInput } from "./LearningOnboarding";
import type { AssessmentTrack } from "./assessment-bank";

const titles:Record<AssessmentTrack,string>={english:"Ingliz tili",russian:"Rus tili",coding:"Dasturlash",cyber:"Kiberxavfsizlik"};

export default function LearningExperienceLab() {
  const [plan,setPlan]=useState<LearningPlanInput|null>(null);
  const [assessmentOpen,setAssessmentOpen]=useState(false);
  const [duelOpen,setDuelOpen]=useState(false);
  const [duelTrack,setDuelTrack]=useState<AssessmentTrack>("english");

  if(assessmentOpen&&plan) return <div className="fixed inset-0 z-[100] h-[100dvh] w-full overflow-y-auto overscroll-y-contain touch-pan-y bg-[#f4f8f7]"><AssessmentFlow track={plan.trackId} plan={plan} onClose={()=>setAssessmentOpen(false)}/></div>;
  if(duelOpen) return <div className="fixed inset-0 z-[100] h-[100dvh] w-full overflow-y-auto overscroll-y-contain touch-pan-y bg-[#f4f8f7]"><SkillDuel skill={titles[duelTrack]} onClose={()=>setDuelOpen(false)}/></div>;

  return <div className="relative">
    <LearningOnboarding onStart={(track,nextPlan)=>{setPlan(nextPlan);setDuelTrack(track);setAssessmentOpen(true);}}/>
    <div className="mx-auto flex max-w-[1320px] justify-end px-4 pb-7 sm:px-7 lg:px-12">
      <button onClick={()=>setDuelOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dce9e5] bg-white/90 px-5 text-xs font-extrabold text-[#087d70] shadow-sm transition hover:border-[#0b9b88] hover:bg-[#eaf7f3]"><Swords size={16}/> Duelni ochish</button>
    </div>
  </div>;
}
