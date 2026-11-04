import React from "react";
import {AbsoluteFill, Composition, Img, interpolate, registerRoot, staticFile, useCurrentFrame} from "remotion";
import {bgGradient,cairo,palette,type} from "../theme";
import {TechnicalDiagram} from "../../../src/components/technical-education/TechnicalDiagram";
import definitions from "../../../src/lib/technical-education/new-diagrams.json";
import {ASSEMBLY_PANELS,panelFaces,panelOrigin,project} from "../review/cabinet-geometry";
type Scene={title:string;detail:string;spoken:string;diagram:string;formula?:string};
type Props={lessonId:string;locale:"ar-EG"|"ar-MSA"|"ar-Gulf"|"en";title:string;scenes:Scene[];sceneFrames:number[]};
const colors:Record<string,string>={ink:palette.ink,teal:palette.inkSoft,mint:palette.mint,pale:palette.creamDeep,purple:palette.lavender,danger:palette.pink,white:palette.white,none:"none"};
const accents=[palette.lavender,palette.mint,palette.peach,palette.pink,palette.yellow];
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};

// Authored diagrams keep their final geometry. Motion builds parts, traces
// relationships, reveals results, then inspects them; never invents dimensions.
function AnimatedDiagram({kind,locale,local,duration}:{kind:string;locale:Props["locale"];local:number;duration:number}){
 const nodes=(definitions as Record<string,Array<Record<string,any>>>)[kind];
 const progress=local/duration,phase=(local%Math.min(duration,420))/Math.min(duration,420);
 if(!nodes){
  const source=TechnicalDiagram({kind:kind as any,locale,title:kind}) as React.ReactElement<any>;
  let counter=0;
  const animate=(node:React.ReactNode):React.ReactNode=>{
   if(!React.isValidElement(node))return node;
   const el=node as React.ReactElement<any>;
   if(typeof el.type==="function")return animate((el.type as any)(el.props));
   if(el.type==="svg")return React.cloneElement(el,{style:{fontFamily:cairo,width:"100%",height:"auto"}},React.Children.map(el.props.children,animate));
   if(el.type==="g"||el.type===React.Fragment)return React.cloneElement(el,{},React.Children.map(el.props.children,animate));
   if(el.type==="title")return null;
   const i=counter++,p=smooth((phase-.035*(i%8))/.22),isText=el.type==="text";
   const props={...el.props,fill:colors[el.props.fill]??el.props.fill,stroke:colors[el.props.stroke]??el.props.stroke};
   if(el.type==="line"||el.type==="path"){props.pathLength=1;props.strokeDasharray=1;props.strokeDashoffset=1-p;}
   return <g key={i} opacity={isText?smooth((phase-.25)/.1):1} transform={isText?undefined:`translate(${(1-p)*(i%2?35:-35)},${(1-p)*(i%3-1)*18})`}>{React.cloneElement(el,props)}</g>;
  };
  return <div style={{width:"100%"}}>{animate(source)}</div>;
 }
 return <svg viewBox="0 0 400 270" width="100%" style={{overflow:"visible",fontFamily:cairo}}>
  {nodes.map(({type:nodeType,value,...attr},i)=>{
   const at=.025*(i%10),p=smooth((phase-at)/.23),props:any=Object.fromEntries(Object.entries(attr).map(([k,v])=>[k,(k==="fill"||k==="stroke")&&typeof v==="string"?(colors[v]??v):v]));
   let transform=nodeType==="text"?undefined:`translate(${(1-p)*(i%2?34:-34)},${(1-p)*(i%3-1)*22})`;
   // The exact authored door rotates around its depicted hinge; the drawer
   // moves from the depicted closed position to its depicted extended one.
   if(kind==="new-M05-L02-motion"&&i===1)transform=`rotate(${-smooth((phase-.3)/.25)*72} 45 82)`;
   if(kind==="new-M05-L03-extension"&&(i===3||i===7))transform=`translate(0,${-60*(1-smooth((phase-.3)/.3))})`;
   if(nodeType==="line"||nodeType==="path"){props.pathLength=1;props.strokeDasharray=1;props.strokeDashoffset=1-p;}
   let opacity=nodeType==="text"?smooth((phase-.27)/.12):1;
   const text=value?.[locale==="en"?"en":"ar"];
   // Arithmetic operands precede the result, preserving the authored values.
   const visibleText=typeof text==="string"&&text.includes("=")&&phase<.48?text.split("=")[0]+" = …":text;
   if(nodeType==="text"){props.direction=locale==="en"?"ltr":"rtl";props.textAnchor="middle";props.fill=palette.ink;props.fontWeight=700;}
   return <g key={i} opacity={opacity} transform={transform}>{React.createElement(nodeType,props,visibleText)}</g>;
  })}
  {nodes.filter(n=>n.type==="line").slice(0,1).map((n,i)=>{
   const t=smooth((phase-.48)/.3),x=Number(n.x1)+(Number(n.x2)-Number(n.x1))*t,y=Number(n.y1)+(Number(n.y2)-Number(n.y1))*t;
   return <circle key={i} cx={x} cy={y} r={4} fill={palette.peach} opacity={phase>.48&&phase<.86?1:0}/>;
  })}
  <rect x="0" y="265" width={400*progress} height="3" rx="2" fill={palette.mint}/>
 </svg>;
}
const panelColors:Record<string,string[]>={A1:[palette.mint,palette.mintDeep,"#b9dfca"],A2:[palette.mint,palette.mintDeep,"#b9dfca"],B2:[palette.peach,"#d48c6d","#f7c5af"],B1:[palette.pink,"#bc6c83","#efb4c4"],C1:[palette.yellow,"#c8aa56","#f8e4a9"],D1:[palette.lavender,"#8371aa","#c5badc"]};
function Cabinet({index,progress}:{index:number;progress:number}){
 const starts=[0,4,8,12,16,20,24],ids=[[],["A1","A2"],["B2"],["B1"],["C1"],["D1"],[]],seconds=starts[index]+progress*(index===6?6:4);
 const faces=ASSEMBLY_PANELS.flatMap(p=>panelFaces(p,seconds)).sort((a,b)=>a.depth-b.depth);
 return <svg viewBox="0 0 1160 1000" width="100%" style={{overflow:"visible"}}>
  <ellipse cx="615" cy="855" rx="355" ry="33" fill={palette.ink} opacity=".07"/>
  {faces.map(f=><polygon key={f.key} points={f.points} fill={panelColors[f.panel.id][Number(f.key.slice(-1))]} stroke={ids[index].includes(f.panel.id)?palette.ink:palette.inkSoft} strokeWidth={ids[index].includes(f.panel.id)?4:1.5} opacity={ids[index].length&&!ids[index].includes(f.panel.id)?.62:1}/>)}
  {ASSEMBLY_PANELS.filter(p=>ids[index].includes(p.id)).map(p=>{const[x,y,z]=panelOrigin(p,seconds);const[px,py]=project([x+p.size[0]/2,y+p.size[1]/2,z]);return <g key={p.id} transform={`translate(${px},${py})`}><rect x="-36" y="-26" width="72" height="52" rx="14" fill={palette.ink}/><text textAnchor="middle" dominantBaseline="middle" fill={palette.white} fontSize="32" fontWeight="900">{p.id}</text></g>})}
  {index===4&&progress>.55&&[0,1].map(i=><g key={i}><rect x="690" y={440+i*240} width="190" height="66" rx="18" fill={palette.white} stroke={palette.yellow} strokeWidth="3"/><text x="785" y={482+i*240} textAnchor="middle" fontSize="35" fontWeight="900" fill={palette.ink}>273 mm</text></g>)}
 </svg>;
}
export function TechnicalMotion(props:Props){
 const frame=useCurrentFrame();let index=0,start=0;
 while(index<props.sceneFrames.length-1&&frame>=start+props.sceneFrames[index])start+=props.sceneFrames[index++];
 const scene=props.scenes[index],local=frame-start,progress=local/props.sceneFrames[index],accent=accents[index%accents.length],en=props.locale==="en",total=props.sceneFrames.reduce((a,b)=>a+b,0);
 const formula=scene.formula?.split(" = ");
 return <AbsoluteFill dir={en?"ltr":"rtl"} style={{background:bgGradient,color:palette.ink,fontFamily:cairo,letterSpacing:0}}>
  <header style={{position:"absolute",left:120,right:120,top:60,display:"flex",alignItems:"center",justifyContent:"space-between",gap:60}}>
   <Img src={staticFile("brand/masaarat-logo-lockup.png")} style={{width:250,height:70,objectFit:"contain"}}/>
   <div style={{fontSize:28,fontWeight:600,maxWidth:1240,textAlign:en?"left":"right",lineHeight:1.5}}>{props.title}</div>
  </header>
  <div style={{position:"absolute",left:90,top:220,width:870,height:700,display:"flex",alignItems:"center"}}>
   {props.lessonId==="M04-L02"?<Cabinet index={index} progress={progress}/>:<AnimatedDiagram kind={scene.diagram} locale={props.locale} local={local} duration={props.sceneFrames[index]}/>}
  </div>
  <aside style={{position:"absolute",right:120,top:225,width:745,minHeight:620,boxSizing:"border-box",padding:"38px 42px",borderRadius:32,background:palette.white,border:`2px solid ${accent}80`,boxShadow:`0 30px 60px -20px ${palette.ink}22`,opacity:interpolate(local,[0,12],[0,1],{extrapolateRight:"clamp"})}}>
   <span style={{display:"inline-block",padding:"8px 20px",background:accent,borderRadius:12,fontSize:type.captionSm,fontWeight:900}}>{en?"Step":"خطوة"} {index+1} / {props.scenes.length}</span>
   <h1 style={{fontSize:scene.title.length>68?42:52,fontWeight:900,lineHeight:1.4,margin:"22px 0"}}>{scene.title}</h1>
   <p style={{fontSize:type.bodyLg,fontWeight:600,lineHeight:type.lhBodyRelaxed,margin:"0 0 24px"}}>{scene.detail}</p>
   {formula&&<div dir="ltr" style={{fontSize:36,fontWeight:700,textAlign:"center",lineHeight:1.55,background:`${accent}40`,padding:"22px 12px",borderRadius:20}}>{formula[0]}{formula.length>1&&<span style={{opacity:progress>.42?1:0}}> = <strong>{formula.slice(1).join(" = ")}</strong></span>}</div>}
  </aside>
  <div style={{position:"absolute",bottom:65,left:120,right:120,display:"flex",gap:14}}>{props.scenes.map((s,i)=><div key={i} style={{flex:1,height:12,borderRadius:8,background:i===index?accent:i<index?palette.mint:`${palette.white}dd`}}/>)}</div>
  <div style={{position:"absolute",bottom:0,left:0,width:`${100*frame/total}%`,height:9,background:accent}}/>
 </AbsoluteFill>;
}
const defaults:Props={lessonId:"M01-L01",locale:"ar-EG",title:"مسارات الفني",scenes:[{title:"",detail:"",spoken:"",diagram:"brief-use"}],sceneFrames:[300]};
registerRoot(()=><Composition id="technical-motion-v2" component={TechnicalMotion} fps={30} width={1920} height={1080} durationInFrames={300} defaultProps={defaults} calculateMetadata={({props})=>({durationInFrames:props.sceneFrames.reduce((a,b)=>a+b,0)})}/>);
