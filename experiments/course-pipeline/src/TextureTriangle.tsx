import React from 'react';
import {brand} from './brand';
const labels={
 'ar-EG':{sand:'رمل',silt:'غرين',clay:'طين',loam:'تربة مزيجية (Loam)',example:'مثال تعليمي: مش قياس من الحقل'},
 en:{sand:'Sand',silt:'Silt',clay:'Clay',loam:'Loam',example:'Worked example, not field measurements'},
 it:{sand:'Sabbia',silt:'Limo',clay:'Argilla',loam:'Franco',example:'Esempio didattico, non misure sul campo'},
 de:{sand:'Sand',silt:'Schluff',clay:'Ton',loam:'Lehm',example:'Rechenbeispiel, keine Feldmesswerte'}
};
const vertices=[[80,440],[720,440],[400,60]];
function point(sand:number,silt:number,clay:number){return [sand*80+silt*720+clay*400,sand*440+silt*440+clay*60]}
function line(a:number[],b:number[]){return {x1:a[0],y1:a[1],x2:b[0],y2:b[1]}}
/** Exact barycentric guide for the one source-checked 40/40/20 example; no invented class regions. */
export function TextureTriangle({locale}:{locale:string}){
 const t=labels[locale as keyof typeof labels]||labels.en;
 return <svg viewBox="0 0 800 620" role="img" aria-label={`${t.sand} 40%, ${t.silt} 40%, ${t.clay} 20%: ${t.loam}`} style={{width:'100%',height:'100%',fontFamily:'inherit'}}>
  <rect width="800" height="620" rx="20" fill={brand.background}/>
  <polygon points={vertices.map(p=>p.join(',')).join(' ')} fill={brand.card} stroke={brand.foreground} strokeWidth="3"/>
  {Array.from({length:9},(_,i)=>(i+1)/10).flatMap(v=>[
   <line key={'c'+v} {...line(point(1-v,0,v),point(0,1-v,v))} stroke={brand.border}/>,
   <line key={'s'+v} {...line(point(v,1-v,0),point(v,0,1-v))} stroke={brand.border}/>,
   <line key={'i'+v} {...line(point(1-v,v,0),point(0,v,1-v))} stroke={brand.border}/>
  ])}
  <line {...line(point(.8,0,.2),point(0,.8,.2))} stroke="#ba7419" strokeWidth="3"/>
  <line {...line(point(.4,0,.6),point(.4,.6,0))} stroke="#3c8c80" strokeWidth="3"/>
  <line {...line(point(0,.4,.6),point(.6,.4,0))} stroke="#637aad" strokeWidth="3"/>
  <circle cx="400" cy="364" r="10" fill={brand.primary} stroke="white" strokeWidth="3"/>
  <rect x="230" y="290" width="340" height="48" rx="12" fill={brand.background} stroke={brand.primary}/>
  <text x="400" y="322" textAnchor="middle" fill={brand.foreground} fontSize="25" fontWeight="700">{t.loam}</text>
  <g fill={brand.foreground} fontSize="23" fontWeight="700" textAnchor="middle">
   <text x="400" y="23">{t.clay}</text><text x="400" y="48" direction="ltr">100%</text>
   <text x="110" y="475">{t.sand}</text><text x="110" y="500" direction="ltr">100%</text>
   <text x="690" y="475">{t.silt}</text><text x="690" y="500" direction="ltr">100%</text>
   <text x="230" y="535">{t.sand}</text><text x="230" y="563" direction="ltr">40%</text>
   <text x="400" y="535">{t.silt}</text><text x="400" y="563" direction="ltr">40%</text>
   <text x="570" y="535">{t.clay}</text><text x="570" y="563" direction="ltr">20%</text>
  </g>
  <text x="400" y="600" textAnchor="middle" fill={brand.foreground} fontSize="18">{t.example}</text>
 </svg>
}
