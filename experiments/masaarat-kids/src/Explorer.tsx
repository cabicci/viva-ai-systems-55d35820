import React from "react";
export function Explorer({frame=0,wrong=false,size=250}:{frame?:number;wrong?:boolean;size?:number}){
 const colour=wrong?"#E48E80":"#86BCE1",bob=Math.sin(frame/14)*4;
 return <svg aria-hidden="true" viewBox="0 0 360 320" width={size}>
 <ellipse cx="180" cy="277" rx="157" ry="35" fill="#DED6EB"/>
 <g transform={"translate(0 "+bob+")"} stroke="#384F61" strokeWidth="5" strokeLinejoin="round">
 <path d="M142 232v37h-34v-12l13-26M199 232v37h35v-12l-13-26" fill="#A797C8"/>
 <path d="M116 165L79 195M229 165l38 26" fill="none" strokeWidth="18" strokeLinecap="round"/>
 <rect x="114" y="151" width="117" height="88" rx="24" fill={colour}/>
 <rect x="91" y="63" width="165" height="109" rx="34" fill={colour}/>
 <path d="M175 63V42"/><circle cx="175" cy="32" r="10" fill="#F2D27A"/>
 <rect x="110" y="83" width="126" height="66" rx="22" fill="#F7FBFC"/>
 <path d="M143 104v13m60-13v13M158 131q15 12 30 0" fill="none" strokeLinecap="round"/>
 <path d="M149 193h47" stroke="#F7FBFC" strokeWidth="10" strokeLinecap="round"/>
 </g>
 {["#82C39E","#F2D27A","#A797C8"].map((c,i)=><path key={c} d="M0 17L12 0l21 5 7 18-22 9Z" fill={c} stroke="#384F61" strokeWidth="3" transform={"translate("+(45+i*100)+" "+(260+Math.sin(frame/15+i)*3)+")"}/>)}
 </svg>;
}
