import { useState } from "react";
import type { SupportedLocale } from "@/lib/locale/types";
import { prototypeCopy } from "./prototype-copy";

const cases = [
  { insert: 50, base: 52, openings: [52, 51, 52], target: 2 },
  { insert: 41, base: 44, openings: [42, 44, 43], target: 3 },
  { insert: 56, base: 61, openings: [60, 61, 60], target: 2 },
  { insert: 38, base: 40, openings: [37, 39, 38], target: 2 },
  { insert: 62, base: 66, openings: [65, 65, 66], target: 3 },
];

function TrayNet({ width, label }: { width: number; label: string }) {
  const h=15, length=82, w=width, far=length+h, bottom=w+h;
  return <svg role="img" aria-label={label} viewBox={`-3 -3 118 ${w+36}`} style={{width:"100%",maxWidth:320,maxHeight:220,direction:"ltr"}} direction="ltr">
    <path d={`M15 0 H${far} V15 H112 V${bottom} H${far} V${bottom+h} H15 V${bottom} H0 V15 H15 Z`} fill="var(--accent,#c5e3d9)" stroke="currentColor" strokeWidth=".65"/>
    <rect x="15" y="15" width={length} height={w} fill="white" stroke="currentColor" strokeDasharray="2 1.6" strokeWidth=".65"/>
    <text x="56" y={bottom/2+7} textAnchor="middle" fontSize="6" fill="#273b48">{length} × {w} mm</text>
  </svg>;
}
function numeric(v: string) {
  const s=v.trim().replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-1632)).replace("٫",".");
  return /^\d+(\.\d+)?$/.test(s) && Number(s)>0 ? Number(s) : NaN;
}
export function PaperFitLab({locale,scope}:{locale:SupportedLocale;scope:string}) {
  const c=prototypeCopy[locale], key="paper-fit-v1:"+scope;
  const [index,setIndex]=useState(0), [value,setValue]=useState(""), [feedback,setFeedback]=useState("");
  const [mode,setMode]=useState<"sim"|"local">("sim");
  const [inputs,setInputs]=useState<string[]>(Array(8).fill("")), [message,setMessage]=useState("");
  const [saved,setSaved]=useState(()=>{try{return localStorage.getItem(key)||""}catch{return ""}});
  const sample=cases[index], needed=sample.base+sample.target-(Math.min(...sample.openings)-sample.insert);
  const correct=feedback==="ok";
  function record() {
    const [id,card,front,middle,back,...trials]=inputs;
    if(!id.trim()||trials.some(s=>!s.trim())||[card,front,middle,back].some(v=>!Number.isFinite(numeric(v)))){setMessage(c.reject);return;}
    const result=Number((Math.min(...[front,middle,back].map(numeric))-numeric(card)).toFixed(3));
    const row=[c.raw+" · "+id,c.object+" · "+card+" mm",c.readings+" · "+[front,middle,back].join(" / ")+" mm",c.result+" · "+result+" mm",...trials.map((s,i)=>(i+1)+". "+s)].join("\n");
    const next=saved ? saved+"\n\n"+row : row;
    try {localStorage.setItem(key,next);setSaved(next);setMessage(c.confirm)} catch {setSaved(next);setMessage(c.record)}
  }
  const button="rounded-md border px-3 py-2",input="block w-full rounded-md border bg-background px-3 py-2";
  return <section data-paper-fit="v1" className="space-y-4 rounded-xl border bg-card p-4" dir={locale==="en"?"ltr":"rtl"}>
    <div className="flex flex-wrap gap-2">{(["sim","local"] as const).map(m=><button key={m} type="button" aria-pressed={mode===m} className={button} onClick={()=>setMode(m)}>{c[m]}</button>)}</div>
    {mode==="sim"?<div className="space-y-3">
      <p>{c.note}</p><TrayNet width={correct?needed:sample.base} label={c.setup}/>
      <dl>{[[c.object,sample.insert],[c.nominal,sample.base],[c.readings,sample.openings.join(" / ")],[c.target,sample.target]].map(([k,v])=><div key={k} className="flex flex-wrap justify-between gap-2 border-b py-1"><dt>{k}</dt><dd dir="ltr">{v} mm</dd></div>)}</dl>
      <label className="block">{c.width}<input className={input} data-fit="proposal" value={value} inputMode="decimal" onChange={e=>{setValue(e.target.value);setFeedback("")}}/></label>
      <button className={button} data-fit="check" type="button" onClick={()=>setFeedback(!Number.isFinite(numeric(value))?"precision":numeric(value)===needed?"ok":"wrong")}>{c.try}</button>
      {feedback&&<p role="status" data-outcome={feedback}>{c[feedback as "wrong"|"precision"|"ok"]}</p>}
      <button className={button} data-fit="next" type="button" onClick={()=>{setIndex((index+1+Math.floor(Math.random()*(cases.length-1)))%cases.length);setFeedback("");setValue("")}}>{c.newCase}</button>
    </div>:<div className="space-y-3"><p>{c.actual}</p>{inputs.map((v,i)=><label className="block" key={i}>{i===0?c.raw:i===1?c.object:i<5?c.readings+" · "+(i-1):c.keep+" · "+(i-4)}<input className={input} value={v} data-entry={i} inputMode={i>=1&&i<=4?"decimal":"text"} onChange={e=>{setInputs(inputs.map((x,j)=>i===j?e.target.value:x));setMessage("")}}/></label>)}
       <button type="button" className={button} data-fit="save" onClick={record}>{c.saved}</button>
       {message&&<p role="status">{message}</p>}{saved&&<label className="block">{c.oldest}<textarea readOnly className={input} rows={8} value={saved}/></label>}
    </div>}
  </section>;
}
