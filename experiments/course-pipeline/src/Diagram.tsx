import React from 'react';

type Props={kind:string;labels:string[];progress?:number;locale?:string;photo?:string};

// A missing approved illustration must never silently fall back to flat artwork.
export function Diagram({labels,photo}:Props){
 if(!photo)return null;
 return <figure style={{margin:0,width:'100%'}}>
  <img src={photo} alt={labels.join(' · ')} style={{width:'100%',display:'block',borderRadius:14,objectFit:'contain'}}/>
  <figcaption style={{display:'flex',justifyContent:'space-around',gap:16,fontSize:13,fontWeight:700,padding:'16px 10px',textAlign:'center'}}>
   {labels.map((label,i)=><span key={i}>{label}</span>)}
  </figcaption>
 </figure>;
}
