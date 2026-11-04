import React from 'react';
import {brand} from './brand';
import model from './assets/texture-solid.png';
import projection from './assets/texture-solid.json';

const copy={
 'ar-EG':{sand:'رمل',silt:'غرين',clay:'طين',loam:'تربة مزيجية',example:'مثال للتعلّم — مش نتيجة عيّنة من الحقل'},
 en:{sand:'Sand',silt:'Silt',clay:'Clay',loam:'Loam',example:'Worked example — not a field sample result'},
 it:{sand:'Sabbia',silt:'Limo',clay:'Argilla',loam:'Franco',example:'Esempio didattico — non il risultato di un campione reale'},
 de:{sand:'Sand',silt:'Schluff',clay:'Ton',loam:'Lehm',example:'Rechenbeispiel — kein Ergebnis einer Feldprobe'},
};

/** The image is a real, reproducible 3D mesh render. Labels use its projected coordinates. */
export function TextureTriangle({locale,imageComponent:Image='img'}:{locale:string;imageComponent?:React.ElementType}){
 const t=copy[locale as keyof typeof copy]||copy.en;
 const {width,height,vertices,hit,specimens}=projection;
 const text=(x:number,y:number,label:string,size=32,color:string=brand.foreground)=><text x={x} y={y} textAnchor="middle" fill={color} fontSize={size} fontWeight="700" direction={/[\u0600-\u06ff]/.test(label)?'rtl':'ltr'}>{label}</text>;
 return <div role="img" aria-label={`${t.sand} 40%, ${t.silt} 40%, ${t.clay} 20%: ${t.loam}`} data-graphics-version={projection.version} style={{position:'relative',width:'100%',aspectRatio:`${width}/${height}`,borderRadius:22,overflow:'hidden',fontFamily:'inherit'}}>
  <Image src={model} alt="" style={{display:'block',width:'100%',height:'100%'}}/>
  <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
   {text(vertices[2][0],vertices[2][1]-76,t.clay)}
   {text(vertices[2][0],vertices[2][1]-38,'100%',27,'#8b5d48')}
   {text(vertices[0][0]-176,vertices[0][1]-13,t.sand)}
   {text(vertices[0][0]-176,vertices[0][1]+25,'100%',27,'#916827')}
   {text(vertices[1][0]+160,vertices[1][1]-8,t.silt)}
   {text(vertices[1][0]+160,vertices[1][1]+30,'100%',27,'#4c7361')}
   <path d={`M${hit[0]+28} ${hit[1]-12}L1215 360`} stroke="#71939a" strokeWidth="2.5"/>
   <rect x="1170" y="259" width="360" height="106" rx="25" fill="white" fillOpacity=".94" stroke="#d6e0dc"/>
   {text(1350,304,t.loam,locale==='ar-EG'?31:34)}
   {text(1350,341,locale==='en'?'40 / 40 / 20':'Loam · 40 / 40 / 20',24,'#537580')}
   {(['sand','silt','clay'] as const).map((kind,i)=><g key={kind}>
    {text(specimens[i][0],specimens[i][1]+111,t[kind],31)}
    {text(specimens[i][0],specimens[i][1]+150,i===2?'20%':'40%',32,['#916827','#4c7361','#8b5d48'][i])}
   </g>)}
   {text(800,1031,t.example,23,brand['muted-foreground'])}
  </svg>
 </div>;
}
