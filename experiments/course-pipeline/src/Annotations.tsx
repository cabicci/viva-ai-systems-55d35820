import React from 'react';

export function Annotations({kind,progress,locale}:{kind:string;progress:number;locale:string}){
 const alpha=(start:number)=>Math.max(0,Math.min(1,(progress-start)*5));
 const outline={filter:'drop-shadow(0 0 2px #fffdf4)',strokeLinejoin:'round'} as React.CSSProperties;
 const points=Array.from({length:15},(_,i)=>{
  const row=Math.floor(i/5),column=row%2?4-i%5:i%5;
  const u=.22+column*.14,v=.22+row*.22;
  const a=[160,425],b=[825,95],c=[1465,465],d=[840,820];
  return [(1-u)*(1-v)*a[0]+u*(1-v)*b[0]+u*v*c[0]+(1-u)*v*d[0],(1-u)*(1-v)*a[1]+u*(1-v)*b[1]+u*v*c[1]+(1-u)*v*d[1]];
 });
 return <svg viewBox="0 0 1600 900" aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',fontFamily:'Cairo, sans-serif'}}>
  {kind==='route'&&<g><path d={'M'+points.map(p=>p.join(' ')).join(' ')} fill="none" stroke="#f5ce65" strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-progress}/>{points.map(([x,y],i)=><g key={i} opacity={alpha(i*.045)}><circle cx={x} cy={y} r={21} fill="#284b3a" stroke="#fffdf4" strokeWidth={3}/><text x={x} y={y+7} textAnchor="middle" fill="white" fontSize={22} fontWeight={800}>{i+1}</text></g>)}</g>}
  {kind==='depth'&&<g opacity={alpha(.15)}><path d="M1120 425V742M1103 446l17-21 17 21M1103 721l17 21 17-21" stroke="#386246" strokeWidth={8} fill="none" style={outline}/><rect x={1145} y={556} width={205} height={58} rx={12} fill="#fffdf3ed"/><text x={1247} y={597} fontSize={34} fontWeight={800} fill="#284b3a" textAnchor="middle">{locale==='ar-EG'?<><tspan direction="ltr" unicodeBidi="isolate">٠–٢٠</tspan><tspan> سم</tspan></>:'0–20 cm'}</text></g>}
  {kind==='mix'&&<g opacity={alpha(.23)}><path d="M560 350C560 270 1000 275 1040 380m-30-15 30 15-10-34" fill="none" stroke="#386246" strokeWidth={9} strokeLinecap="round" style={outline}/><path d="M1000 550q135 10 200 140m-5-37 5 37-39-4" fill="none" stroke="#386246" strokeWidth={9} strokeLinecap="round" style={outline}/></g>}
  {kind==='label'&&<g opacity={alpha(.18)} transform="translate(380 440) rotate(-8)"><rect x={-140} y={-115} width={280} height={230} rx={10} fill="#fffdf4f5" stroke="#8b967a" strokeWidth={2}/><text textAnchor="middle" y={-60} fontSize={41} fill="#284b3a" fontWeight={800}>A-01</text><text textAnchor="middle" y={-9} fontSize={27} fill="#284b3a">A · 0–20 cm</text><text textAnchor="middle" y={40} fontSize={27} fill="#284b3a">2026-10-13</text><text textAnchor="middle" y={85} fontSize={29} fill="#284b3a">15</text></g>}
 </svg>
}
