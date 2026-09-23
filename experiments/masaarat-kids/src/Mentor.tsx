import React from "react";
export function Mentor({frame=0,pose="wave",size=280}:{frame?:number;pose?:string;size?:number}) {
 const bob=Math.sin(frame/17)*4, wave=pose==="wave"?Math.sin(frame/8)*14:pose==="point"?-35:0;
 const blink=frame%110>104, mouth=frame%18<9?3:9;
 return <svg aria-hidden="true" viewBox="0 0 320 380" width={size} style={{overflow:"visible"}}>
 <ellipse cx="160" cy="353" rx="95" ry="15" fill="#2A2620" opacity=".08"/>
 <g transform={"translate(0 "+bob+")"}>
 <path d="M122 293 L112 333 Q109 347 131 346 L145 344 L148 296" fill="#A797C8" stroke="#384F61" strokeWidth="5"/>
 <path d="M177 296 L176 340 L204 346 Q221 345 211 329 L203 289" fill="#A797C8" stroke="#384F61" strokeWidth="5"/>
 <path d="M109 197 Q66 209 64 260 Q66 271 79 267 L113 235" fill="#82C39E" stroke="#384F61" strokeWidth="5"/>
 <g transform={"rotate("+wave+" 217 214)"}>
 <path d="M210 199 Q247 185 258 148 Q263 134 273 143 Q285 155 271 187 L234 234" fill="#82C39E" stroke="#384F61" strokeWidth="5"/>
 <path d="M264 146 L270 126 M272 151 L285 136 M274 160 L295 154" stroke="#384F61" strokeWidth="5" strokeLinecap="round"/>
 </g>
 <rect x="103" y="184" width="117" height="121" rx="38" fill="#82C39E" stroke="#384F61" strokeWidth="5"/>
 <rect x="128" y="214" width="67" height="49" rx="16" fill="#FBF7EE"/>
 <path d="M145 238 L156 246 L181 229" fill="none" stroke="#5DA980" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
 <path d="M160 73 V45" stroke="#384F61" strokeWidth="5"/>
 <circle cx="160" cy="37" r="12" fill="#F2D27A" stroke="#384F61" strokeWidth="4"/>
 <rect x="73" y="73" width="177" height="128" rx="47" fill="#DCEFE3" stroke="#384F61" strokeWidth="5"/>
 <rect x="91" y="99" width="141" height="68" rx="30" fill="#FBF7EE"/>
 <ellipse cx="131" cy="130" rx="8" ry={blink?2:12} fill="#384F61"/>
 <ellipse cx="193" cy="130" rx="8" ry={blink?2:12} fill="#384F61"/>
 <ellipse cx="162" cy="151" rx="12" ry={mouth} fill="#384F61"/>
 <circle cx="110" cy="152" r="7" fill="#F0A988" opacity=".75"/>
 <circle cx="213" cy="152" r="7" fill="#F0A988" opacity=".75"/>
 </g></svg>;
}
