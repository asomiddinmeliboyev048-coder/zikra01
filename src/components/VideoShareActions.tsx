"use client";
import { useState } from "react";

export default function VideoShareActions({title,compact=false}:{title:string;compact?:boolean}) {
  const [copied,setCopied]=useState(false);
  async function copyLink(){
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1800);
    } catch {
      window.prompt("Video havolasini nusxalang:",window.location.href);
    }
  }
  async function share(){
    const payload={title,text:title,url:window.location.href};
    if(navigator.share){try{await navigator.share(payload);}catch{/* foydalanuvchi bekor qildi */}}
    else await copyLink();
  }
  return <div className="flex shrink-0 gap-2">
    <button type="button" onClick={share} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-gray-100 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15" aria-label="Videoni ulashish">↗ Ulashish</button>
    {!compact && <button type="button" onClick={copyLink} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-gray-100 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">▢ {copied?"Nusxalandi":"Nusxa olish"}</button>}
  </div>;
}
